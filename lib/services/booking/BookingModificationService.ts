/**
 * @fileoverview BookingModificationService — extend stays and change/upgrade/downgrade rooms.
 * Location: lib/services/booking/BookingModificationService.ts
 *
 * Closes the PMS gap (vs CiMSO INNkeeper): existing reservations could only transition status,
 * never be re-quoted. This service re-prices from the room's canonical nightly rate, re-checks
 * availability (excluding the booking itself), updates the booking + booking_rooms, reprices the
 * folio room charge (mutate when open, post an adjustment when already settled), and audits.
 *
 * Money handling: never mutate a settled charge — post a signed `adjustment` for the delta so the
 * ledger stays append-only and reconcilable.
 */
import {
  db,
  bookings as bookingsSchema,
  bookingRooms as bookingRoomsSchema,
  rooms as roomsSchema,
  bookingCharges,
} from '@/lib/db';
import type { Booking } from '@/lib/db/schema';
import { and, eq, gt, inArray, lt, ne, sql } from 'drizzle-orm';
import { AppError, handleServiceError } from '@/lib/utils/errors';
import { recordAuditTrail } from '@/lib/compliance/record-audit';
import { nightsBetween, quoteStay } from '@/lib/services/booking/stay-pricing';

// Re-exported for callers/tests that import the pricing helpers from this module.
export { nightsBetween, quoteStay } from '@/lib/services/booking/stay-pricing';
export type { StayQuote } from '@/lib/services/booking/stay-pricing';

/** Booking states that may still be re-quoted. Checked-out/cancelled/no-show are terminal. */
const MODIFIABLE_STATUSES = ['confirmed', 'assigned', 'checked_in', 'stayover'] as const;

/** A booking guaranteed (at runtime, after guards) to have non-null stay dates. */
type ModifiableBooking = Booking & { checkInDate: string; checkOutDate: string };

type ModifyResult = {
  bookingId: string;
  previousTotal: number;
  newTotal: number;
  delta: number;
  currency: string;
};

export class BookingModificationService {
  /** Extend (or shorten) a stay to a new check-out date and reprice. */
  async extendStay(input: {
    bookingId: string;
    tenantId: string;
    newCheckOutDate: string; // YYYY-MM-DD
    actorUserId?: string | null;
    request?: import('next/server').NextRequest;
  }): Promise<ModifyResult> {
    try {
      const booking = await this.loadModifiableBooking(input.bookingId, input.tenantId);
      const room = await this.loadBookingRoom(booking.id);

      const newCheckOut = input.newCheckOutDate;
      if (nightsBetween(booking.checkInDate, newCheckOut) <= 0) {
        throw new AppError(400, 'New check-out must be after check-in.');
      }
      if (newCheckOut === booking.checkOutDate) {
        throw new AppError(400, 'New check-out matches the current check-out.');
      }

      // Extending: the added window must be free on the same room (excluding this booking).
      if (
        nightsBetween(booking.checkOutDate, newCheckOut) > 0 &&
        (await this.hasConflict(room.roomId, booking.checkOutDate, newCheckOut, booking.id))
      ) {
        throw new AppError(409, 'The room is not available for the extended dates.');
      }

      const ratePerNight = await this.roomRate(room.roomId);
      const quote = quoteStay(ratePerNight, nightsBetween(booking.checkInDate, newCheckOut));

      return this.applyReprice(booking, {
        action: 'booking.extend_stay',
        newCheckOutDate: newCheckOut,
        newRoomId: room.roomId,
        ratePerNight: quote.ratePerNight,
        newTotal: quote.total,
        actorUserId: input.actorUserId ?? null,
        request: input.request,
        auditExtra: { fromCheckOut: booking.checkOutDate, toCheckOut: newCheckOut, nights: quote.nights },
      });
    } catch (error) {
      throw handleServiceError(error, 'Error extending stay');
    }
  }

  /** Move a booking to a different room (upgrade or downgrade) and reprice. */
  async changeRoom(input: {
    bookingId: string;
    tenantId: string;
    newRoomId: string;
    actorUserId?: string | null;
    request?: import('next/server').NextRequest;
  }): Promise<ModifyResult> {
    try {
      const booking = await this.loadModifiableBooking(input.bookingId, input.tenantId);
      const current = await this.loadBookingRoom(booking.id);
      if (input.newRoomId === current.roomId) {
        throw new AppError(400, 'Booking is already in that room.');
      }

      const target = await this.loadGuestRoom(input.newRoomId);
      const guests = current.guestCount ?? 1;
      if (guests > (Number(target.maxOccupancy) || 2)) {
        throw new AppError(400, 'The selected room cannot accommodate this booking.');
      }
      if (await this.hasConflict(input.newRoomId, booking.checkInDate, booking.checkOutDate, booking.id)) {
        throw new AppError(409, 'The selected room is not available for these dates.');
      }

      const ratePerNight = Number(target.baseRate ?? 0);
      const quote = quoteStay(ratePerNight, nightsBetween(booking.checkInDate, booking.checkOutDate));
      const previousTotal = Number(booking.totalAmount ?? 0);
      const action = quote.total >= previousTotal ? 'booking.upgrade_room' : 'booking.downgrade_room';

      return this.applyReprice(booking, {
        action,
        newCheckOutDate: booking.checkOutDate,
        newRoomId: input.newRoomId,
        ratePerNight: quote.ratePerNight,
        newTotal: quote.total,
        actorUserId: input.actorUserId ?? null,
        request: input.request,
        auditExtra: { fromRoomId: current.roomId, toRoomId: input.newRoomId },
      });
    } catch (error) {
      throw handleServiceError(error, 'Error changing room');
    }
  }

  // ---- internals -----------------------------------------------------------

  private async loadModifiableBooking(bookingId: string, tenantId: string): Promise<ModifiableBooking> {
    const [booking] = await db
      .select()
      .from(bookingsSchema)
      .where(and(eq(bookingsSchema.id, bookingId), eq(bookingsSchema.tenantId, tenantId)))
      .limit(1);
    if (!booking) throw new AppError(404, 'Booking not found.');
    if (!MODIFIABLE_STATUSES.includes(booking.status as (typeof MODIFIABLE_STATUSES)[number])) {
      throw new AppError(409, `A ${booking.status} booking cannot be modified.`);
    }
    if (!booking.checkInDate || !booking.checkOutDate) {
      throw new AppError(409, 'Booking is missing stay dates.');
    }
    return booking as ModifiableBooking;
  }

  private async loadBookingRoom(
    bookingId: string,
  ): Promise<{ roomId: string; guestCount: number | null }> {
    const [row] = await db
      .select()
      .from(bookingRoomsSchema)
      .where(eq(bookingRoomsSchema.bookingId, bookingId))
      .limit(1);
    if (!row || !row.roomId) throw new AppError(409, 'Booking has no room assigned.');
    return { roomId: row.roomId, guestCount: row.guestCount };
  }

  private async loadGuestRoom(roomId: string) {
    const [room] = await db.select().from(roomsSchema).where(eq(roomsSchema.id, roomId)).limit(1);
    if (!room) throw new AppError(404, 'Target room not found.');
    if (room.inventoryKind && room.inventoryKind !== 'guest_room') {
      throw new AppError(400, 'Target is not a guest room.');
    }
    if (room.status && room.status !== 'available' && room.status !== 'occupied') {
      throw new AppError(409, 'Target room is not bookable.');
    }
    return room;
  }

  private async roomRate(roomId: string): Promise<number> {
    const [room] = await db
      .select({ baseRate: roomsSchema.baseRate })
      .from(roomsSchema)
      .where(eq(roomsSchema.id, roomId))
      .limit(1);
    return Number(room?.baseRate ?? 0);
  }

  /** True if another active booking overlaps [checkIn, checkOut) on the room. */
  private async hasConflict(
    roomId: string,
    checkIn: string,
    checkOut: string,
    excludeBookingId: string,
  ): Promise<boolean> {
    const [{ value }] = await db
      .select({ value: sql<number>`count(*)` })
      .from(bookingsSchema)
      .leftJoin(bookingRoomsSchema, eq(bookingsSchema.id, bookingRoomsSchema.bookingId))
      .where(
        and(
          eq(bookingRoomsSchema.roomId, roomId),
          ne(bookingsSchema.id, excludeBookingId),
          inArray(bookingsSchema.status, ['confirmed', 'assigned', 'checked_in', 'stayover']),
          lt(bookingsSchema.checkInDate, checkOut),
          gt(bookingsSchema.checkOutDate, checkIn),
        ),
      );
    return Number(value) > 0;
  }

  /** Apply the new room/dates + total to the booking, booking_rooms, folio, and audit. */
  private async applyReprice(
    booking: Booking,
    opts: {
      action: string;
      newCheckOutDate: string;
      newRoomId: string;
      ratePerNight: number;
      newTotal: number;
      actorUserId: string | null;
      request?: import('next/server').NextRequest;
      auditExtra: Record<string, unknown>;
    },
  ): Promise<ModifyResult> {
    const previousTotal = Number(booking.totalAmount ?? 0);
    const delta = Math.round((opts.newTotal - previousTotal) * 100) / 100;
    const currency = booking.currency ?? 'NAD';

    await db.transaction(async (tx) => {
      await tx
        .update(bookingsSchema)
        .set({
          checkOutDate: opts.newCheckOutDate,
          totalAmount: opts.newTotal.toFixed(2),
          updatedAt: new Date(),
        })
        .where(eq(bookingsSchema.id, booking.id));

      await tx
        .update(bookingRoomsSchema)
        .set({ roomId: opts.newRoomId, rateAmount: opts.ratePerNight.toFixed(2) })
        .where(eq(bookingRoomsSchema.bookingId, booking.id));

      await this.repriceFolio(tx, booking, opts.newTotal, delta, currency);
    });

    await recordAuditTrail({
      tenantId: booking.tenantId ?? null,
      userId: opts.actorUserId,
      action: opts.action,
      resourceType: 'booking',
      resourceId: booking.id,
      oldValues: { totalAmount: previousTotal, checkOutDate: booking.checkOutDate },
      newValues: { totalAmount: opts.newTotal, delta, ...opts.auditExtra },
      request: opts.request,
    });

    return { bookingId: booking.id, previousTotal, newTotal: opts.newTotal, delta, currency };
  }

  /**
   * Reprice the room charge: mutate the open `room` charge in place; if it is already settled,
   * leave it and post a signed `adjustment` for the delta so settled money is never rewritten.
   */
  private async repriceFolio(
    tx: Parameters<Parameters<typeof db.transaction>[0]>[0],
    booking: Booking,
    newTotal: number,
    delta: number,
    currency: string,
  ): Promise<void> {
    const [roomCharge] = await tx
      .select()
      .from(bookingCharges)
      .where(and(eq(bookingCharges.bookingId, booking.id), eq(bookingCharges.chargeType, 'room')))
      .limit(1);

    if (!roomCharge) {
      if (newTotal > 0) {
        await tx.insert(bookingCharges).values({
          tenantId: booking.tenantId!,
          bookingId: booking.id,
          chargeType: 'room',
          description: `Room stay ${booking.bookingReference}`,
          amount: newTotal.toFixed(2),
          currency,
          status: 'open',
        });
      }
      return;
    }

    if (roomCharge.status === 'settled') {
      if (delta !== 0) {
        await tx.insert(bookingCharges).values({
          tenantId: booking.tenantId!,
          bookingId: booking.id,
          chargeType: 'adjustment',
          description: `Booking modification adjustment ${booking.bookingReference}`,
          amount: delta.toFixed(2),
          currency,
          status: 'open',
        });
      }
      return;
    }

    await tx
      .update(bookingCharges)
      .set({ amount: newTotal.toFixed(2) })
      .where(eq(bookingCharges.id, roomCharge.id));
  }
}

export const bookingModificationService = new BookingModificationService();
