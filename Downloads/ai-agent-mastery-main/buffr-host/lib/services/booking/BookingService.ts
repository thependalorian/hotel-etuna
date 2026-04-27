import { db, bookings as bookingsSchema, rooms as roomsSchema, bookingRooms as bookingRoomsSchema } from '@/lib/db';
import { AppError, handleServiceError } from '@/lib/utils/errors';
import { and, eq, inArray, notInArray, lt, gt, count, sql } from 'drizzle-orm';
import type { Booking, Room } from '@/lib/db/schema';
import { BOOKING_STATUS_TRANSITIONS } from '@/lib/workflows/domainTransitions';
import { invokeLifecycleTransition } from '@/lib/workflows/genericLifecycleGraph';
import { CrmGraphMemoryService } from '@/lib/services/crm/CrmGraphMemoryService';

// A DTO for creating a booking
export interface CreateBookingDTO {
  checkInDate: Date;
  checkOutDate: Date;
  numGuests: number;
  roomId: string;
  guestId: string;
}

export type BookingDetailsRow = Record<string, unknown> & {
  id: string;
  tenant_id: string;
  property_id: string | null;
  guest_id: string | null;
  booking_reference: string;
  status: string;
  check_in_date: string;
  check_out_date: string;
  total_amount?: string | number | null;
  currency?: string | null;
  payment_status?: string | null;
  special_requests?: string | null;
  guest?: Record<string, unknown> | null;
  property?: Record<string, unknown> | null;
};

const crmGraphMemory = new CrmGraphMemoryService();

export class BookingService {
  private normalizeBookingRow<T extends Record<string, unknown>>(row: T): T {
    const mutable = row as Record<string, unknown>;
    if (typeof mutable.status === 'string') {
      mutable.status = mutable.status.toLowerCase();
    }
    return mutable as T;
  }
  /**
   * Get all bookings for a property.
   */
  async getBookingsForProperty(propertyId: string, tenantId: string): Promise<any[]> {
    try {
      const rows = await db.execute(sql`
        SELECT id, tenant_id, property_id, guest_id, booking_reference, status, check_in_date, check_out_date, room_count, adult_count, child_count, created_at, updated_at
        FROM bookings
        WHERE property_id = ${propertyId}
          AND tenant_id = ${tenantId}
        ORDER BY check_in_date DESC
      `);
      return (rows.rows as any[]).map((row) => this.normalizeBookingRow(row));
    } catch (error) {
      throw handleServiceError(error, 'Error fetching bookings');
    }
  }

  /**
   * Create a new booking.
   */
  async createBooking(data: CreateBookingDTO): Promise<Booking> {
    try {
      const roomRows = await db.execute(sql`
        SELECT r.id, r.property_id, r.max_occupancy, p.tenant_id
        FROM rooms r
        JOIN properties p ON p.id = r.property_id
        WHERE r.id = ${data.roomId}
        LIMIT 1
      `);
      const room = roomRows.rows[0] as
        | { id: string; property_id: string; max_occupancy: number; tenant_id: string }
        | undefined;
      if (!room) {
        throw new AppError(404, 'Room not found.');
      }
      const tenantId = room.tenant_id;

      if (data.numGuests > (Number(room.max_occupancy) || 2)) {
        throw new AppError(400, 'Number of guests exceeds room capacity.');
      }

      // Check for booking conflicts
      const conflictingBookings = await db
        .select({ value: count() })
        .from(bookingsSchema)
        .leftJoin(bookingRoomsSchema, eq(bookingsSchema.id, bookingRoomsSchema.bookingId))
        .where(
          and(
            eq(bookingRoomsSchema.roomId, data.roomId),
            inArray(bookingsSchema.status, ['CONFIRMED', 'CHECKED_IN']),
            lt(bookingsSchema.checkInDate, data.checkOutDate.toISOString().slice(0, 10)),
            gt(bookingsSchema.checkOutDate, data.checkInDate.toISOString().slice(0, 10))
          )
        );

      if (conflictingBookings[0].value > 0) {
        throw new AppError(409, 'This room is already booked for the selected dates.');
      }

      const checkInStr = data.checkInDate.toISOString().slice(0, 10);
      const checkOutStr = data.checkOutDate.toISOString().slice(0, 10);
      const newBooking = await db.transaction(async (tx) => {
        const bookingResult = await tx.execute(sql`
          INSERT INTO bookings (
            id, tenant_id, property_id, guest_id, booking_reference, status, check_in_date, check_out_date, room_count, adult_count, child_count, created_at, updated_at
          )
          VALUES (
            gen_random_uuid(),
            ${tenantId},
            ${room.property_id},
            ${data.guestId},
            ${`BR-${Date.now()}`},
            'CONFIRMED',
            ${checkInStr},
            ${checkOutStr},
            1,
            ${data.numGuests},
            0,
            NOW(),
            NOW()
          )
          RETURNING id, tenant_id, property_id, guest_id, booking_reference, status, check_in_date, check_out_date, room_count, adult_count, child_count, created_at, updated_at
        `);

        const newBooking = this.normalizeBookingRow(bookingResult.rows[0] as any);

        await tx.execute(sql`
          INSERT INTO booking_rooms (id, booking_id, room_id, guest_count, created_at)
          VALUES (gen_random_uuid(), ${newBooking.id}, ${data.roomId}, ${data.numGuests}, NOW())
        `);

        return newBooking;
      });

      if (newBooking.guestId && newBooking.propertyId) {
        await crmGraphMemory.ensureEdge({
          tenantId,
          srcType: 'guest',
          srcId: newBooking.guestId,
          dstType: 'property',
          dstId: newBooking.propertyId,
          relationType: 'booked_at',
          metadata: { bookingId: newBooking.id },
        });
      }

      return newBooking;
    } catch (error: any) {
      if (error instanceof AppError) {
        throw error;
      }
      throw handleServiceError(error, 'Error creating booking');
    }
  }

  /**
   * Get a booking by ID.
   */
  async getBookingById(bookingId: string, tenantId: string): Promise<BookingDetailsRow | null> {
    try {
      const rows = await db.execute(sql`
        SELECT
          b.id,
          b.tenant_id,
          b.property_id,
          b.guest_id,
          b.booking_reference,
          b.status,
          b.check_in_date,
          b.check_out_date,
          b.room_count,
          b.adult_count,
          b.child_count,
          NULL::numeric AS total_amount,
          'NAD'::text AS currency,
          NULL::text AS payment_status,
          NULL::text AS special_requests,
          b.created_at,
          b.updated_at,
          jsonb_build_object(
            'id', g.id,
            'first_name', g.first_name,
            'last_name', g.last_name,
            'email', g.email,
            'phone', g.phone,
            'marketing_consent', g.marketing_consent
          ) AS guest,
          jsonb_build_object(
            'id', p.id,
            'name', p.name,
            'address', p.address,
            'city', p.city,
            'country', p.country
          ) AS property
        FROM bookings b
        LEFT JOIN guests g ON g.id = b.guest_id AND g.tenant_id = b.tenant_id
        LEFT JOIN properties p ON p.id = b.property_id AND p.tenant_id = b.tenant_id
        WHERE b.id = ${bookingId}
          AND b.tenant_id = ${tenantId}
        LIMIT 1
      `);
      const row = (rows.rows[0] as BookingDetailsRow | undefined) ?? null;
      return row ? this.normalizeBookingRow(row) : null;
    } catch (error) {
      throw handleServiceError(error, 'Error fetching booking');
    }
  }

  /**
   * Get all bookings for a tenant with optional filters.
   */
  async getBookingsByTenant(
    tenantId: string,
    filters?: {
      status?: string;
      propertyId?: string;
      search?: string;
    }
  ): Promise<any[]> {
    try {
      const rows = await db.execute(sql`
        SELECT id, tenant_id, property_id, guest_id, booking_reference, status, check_in_date, check_out_date, room_count, adult_count, child_count, created_at, updated_at
        FROM bookings
        WHERE tenant_id = ${tenantId}
        ORDER BY check_in_date DESC
      `);
      return (rows.rows as any[])
        .map((row) => this.normalizeBookingRow(row))
        .filter((b) => {
        const matchesStatus = filters?.status ? b.status === filters.status.toLowerCase() : true;
        const matchesProperty = filters?.propertyId ? b.property_id === filters.propertyId : true;
        const matchesSearch = filters?.search
          ? String(b.booking_reference ?? '').includes(filters.search)
          : true;
        return matchesStatus && matchesProperty && matchesSearch;
      });
    } catch (error) {
      throw handleServiceError(error, 'Error fetching bookings by tenant');
    }
  }

  /**
   * Get available rooms for a property within a date range.
   */
  async getAvailableRooms(propertyId: string, checkInDate: Date, checkOutDate: Date): Promise<Room[]> {
    try {
      const checkInStr = checkInDate.toISOString().slice(0, 10);
      const checkOutStr = checkOutDate.toISOString().slice(0, 10);
      const bookedRoomIdsQuery = db
        .select({ id: bookingRoomsSchema.roomId })
        .from(bookingRoomsSchema)
        .leftJoin(bookingsSchema, eq(bookingRoomsSchema.bookingId, bookingsSchema.id))
        .where(
          and(
            eq(bookingsSchema.propertyId, propertyId),
            inArray(bookingsSchema.status, ['confirmed', 'checked_in']),
            lt(bookingsSchema.checkInDate, checkOutStr),
            gt(bookingsSchema.checkOutDate, checkInStr)
          )
        );

      const availableRooms = await db
        .select()
        .from(roomsSchema)
        .where(
          and(
            eq(roomsSchema.propertyId, propertyId),
            notInArray(roomsSchema.status, ['OUT_OF_ORDER']),
            notInArray(roomsSchema.id, bookedRoomIdsQuery)
          )
        );

      return availableRooms;
    } catch (error) {
      throw handleServiceError(error, 'Error fetching available rooms');
    }
  }

  /**
   * Apply booking status change via LangGraph-validated lifecycle (room side-effects included).
   */
  async transitionBookingStatus(
    bookingId: string,
    tenantId: string,
    targetStatus: string
  ): Promise<Booking> {
    try {
      const [booking] = await db
        .select()
        .from(bookingsSchema)
        .where(and(eq(bookingsSchema.id, bookingId), eq(bookingsSchema.tenantId, tenantId)))
        .limit(1);

      if (!booking) {
        throw new AppError(404, 'Booking not found');
      }

      const out = await invokeLifecycleTransition(
        'booking',
        BOOKING_STATUS_TRANSITIONS,
        booking.status || 'pending',
        targetStatus
      );

      if (out.errorMessage || !out.resolvedStatus) {
        throw new AppError(400, out.errorMessage || 'Invalid status transition');
      }

      const next = out.resolvedStatus;
      const now = new Date();

      const [updated] = await db.transaction(async (tx) => {
        const patch: Record<string, unknown> = {
          status: next,
          updatedAt: now,
        };
        if (next === 'checked_in') {
          patch.actualCheckInDate = now;
        }
        if (next === 'checked_out') {
          patch.actualCheckOutDate = now;
        }

        const [row] = await tx
          .update(bookingsSchema)
          .set(patch as Partial<Booking>)
          .where(eq(bookingsSchema.id, bookingId))
          .returning();

        const roomLinks = await tx
          .select({ roomId: bookingRoomsSchema.roomId })
          .from(bookingRoomsSchema)
          .where(eq(bookingRoomsSchema.bookingId, bookingId));

        for (const { roomId } of roomLinks) {
          if (!roomId) continue;
          if (next === 'checked_in') {
            await tx
              .update(roomsSchema)
              .set({ status: 'occupied', updatedAt: now })
              .where(eq(roomsSchema.id, roomId));
          } else if (next === 'checked_out' || next === 'cancelled') {
            await tx
              .update(roomsSchema)
              .set({ status: 'available', updatedAt: now })
              .where(eq(roomsSchema.id, roomId));
          }
        }

        return row ? [row] : [];
      });

      if (!updated) {
        throw new AppError(500, 'Failed to update booking');
      }

      if (booking.guestId && booking.propertyId) {
        const meta = { bookingId: booking.id };
        if (next === 'confirmed') {
          await crmGraphMemory.ensureEdge({
            tenantId,
            srcType: 'guest',
            srcId: booking.guestId,
            dstType: 'property',
            dstId: booking.propertyId,
            relationType: 'booked_at',
            metadata: meta,
          });
        }
        if (next === 'checked_out') {
          await crmGraphMemory.ensureEdge({
            tenantId,
            srcType: 'guest',
            srcId: booking.guestId,
            dstType: 'property',
            dstId: booking.propertyId,
            relationType: 'stayed_at',
            metadata: meta,
          });
        }
      }

      return updated;
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw handleServiceError(error, 'transition booking status');
    }
  }
}
