/**
 * @fileoverview BookingService — core booking lifecycle business logic.
 *
 * Creates, reads, updates, and transitions bookings (status workflow via
 * domainTransitions), computes room availability, and enforces deposit rules.
 * Location: lib/services/booking/BookingService.ts
 */
import { db, bookings as bookingsSchema, rooms as roomsSchema, bookingRooms as bookingRoomsSchema } from '@/lib/db';
import { AppError, handleServiceError } from '@/lib/utils/errors';
import { and, eq, inArray, notInArray, lt, gt, count, sql } from 'drizzle-orm';
import type { Booking, Room } from '@/lib/db/schema';
import { BOOKING_STATUS_TRANSITIONS } from '@/lib/workflows/domainTransitions';
import { invokeLifecycleTransition } from '@/lib/workflows/genericLifecycleGraph';
import {
  assertTransition,
  type ReservationStatus,
} from '@/lib/services/booking/ReservationStateMachine';
import { CrmGraphMemoryService } from '@/lib/services/crm/CrmGraphMemoryService';
import {
  scheduleBookingCreatedEffects,
  scheduleBookingTransitionEffects,
} from '@/lib/services/booking/bookingLifecycleSideEffects';
import { FolioService } from '@/lib/services/folio/FolioService';
import {
  calculateCampsiteTotal,
  calculateConferenceTotal,
  campsiteGuestTotal,
  type CampsitePricingInput,
} from '@/lib/services/booking/FacilityBookingPricing';
import { isFacilityBookingKind, type BookingKind } from '@/lib/bookings/booking-kind';
import { DEFAULT_BOOKING_DEPOSIT_PERCENT, withDepositPricingDetails } from '@/lib/bookings/deposit';
import { nightsBetween, quoteStay } from '@/lib/services/booking/stay-pricing';

// A DTO for creating a booking
export interface CreateBookingDTO {
  checkInDate: Date;
  checkOutDate: Date;
  numGuests: number;
  roomId: string;
  guestId: string;
}

export interface CreateFacilityBookingDTO {
  bookingKind: 'conference' | 'campsite';
  roomId: string;
  guestId: string;
  checkInDate: Date;
  checkOutDate: Date;
  pricingDetails?: Record<string, unknown>;
  /** Campsite only */
  namibianGuests?: number;
  nonNamibianGuests?: number;
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
  payment_method?: string | null;
  amount_tendered?: string | number | null;
  change_given?: string | number | null;
  receipt_number?: string | null;
  created_at?: string | Date | null;
  special_requests?: string | null;
  guest?: Record<string, unknown> | null;
  property?: Record<string, unknown> | null;
  booking_kind?: string | null;
  bookingKind?: string | null;
  pricing_details?: Record<string, unknown> | null;
  pricingDetails?: Record<string, unknown> | null;
  inventory_kind?: string | null;
  inventoryKind?: string | null;
  room_type?: string | null;
  roomType?: string | null;
};

const crmGraphMemory = new CrmGraphMemoryService();
const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

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
  async getBookingsForProperty(
    propertyId: string,
    tenantId: string,
    options?: { bookingKind?: BookingKind }
  ): Promise<any[]> {
    try {
      const kindFilter = options?.bookingKind
        ? sql` AND b.booking_kind = ${options.bookingKind}`
        : sql``;
      const rows = await db.execute(sql`
        SELECT
          b.id, b.tenant_id, b.property_id, b.guest_id, b.booking_reference, b.status,
          b.check_in_date, b.check_out_date, b.room_count, b.adult_count, b.child_count,
          b.total_amount, b.currency, b.payment_status, b.booking_kind, b.pricing_details,
          b.created_at, b.updated_at,
          (SELECT r.inventory_kind FROM booking_rooms br JOIN rooms r ON r.id = br.room_id
           WHERE br.booking_id = b.id LIMIT 1) AS inventory_kind,
          (SELECT r.room_type FROM booking_rooms br JOIN rooms r ON r.id = br.room_id
           WHERE br.booking_id = b.id LIMIT 1) AS room_type
        FROM bookings b
        WHERE b.property_id = ${propertyId}
          AND b.tenant_id = ${tenantId}
          ${kindFilter}
        ORDER BY b.check_in_date DESC
      `);
      return (rows.rows as any[]).map((row) => this.normalizeBookingRow(row));
    } catch (error) {
      throw handleServiceError(error, 'Error fetching bookings');
    }
  }

  /**
   * Bookings for a property overlapping a date range (calendar views).
   */
  async getBookingsForPropertyInDateRange(
    propertyId: string,
    tenantId: string,
    rangeStart: string,
    rangeEnd: string,
    options?: { bookingKind?: BookingKind }
  ): Promise<any[]> {
    try {
      const kindFilter = options?.bookingKind
        ? sql` AND b.booking_kind = ${options.bookingKind}`
        : sql``;
      const rows = await db.execute(sql`
        SELECT
          b.id, b.tenant_id, b.property_id, b.guest_id, b.booking_reference, b.status,
          b.check_in_date, b.check_out_date, b.room_count, b.adult_count, b.child_count,
          b.total_amount, b.currency, b.payment_status, b.booking_kind, b.pricing_details,
          b.created_at, b.updated_at,
          (SELECT r.inventory_kind FROM booking_rooms br JOIN rooms r ON r.id = br.room_id
           WHERE br.booking_id = b.id LIMIT 1) AS inventory_kind,
          (SELECT r.room_type FROM booking_rooms br JOIN rooms r ON r.id = br.room_id
           WHERE br.booking_id = b.id LIMIT 1) AS room_type
        FROM bookings b
        WHERE b.property_id = ${propertyId}
          AND b.tenant_id = ${tenantId}
          AND b.check_out_date >= ${rangeStart}
          AND b.check_in_date <= ${rangeEnd}
          ${kindFilter}
        ORDER BY b.check_in_date ASC
      `);
      return (rows.rows as any[]).map((row) => this.normalizeBookingRow(row));
    } catch (error) {
      throw handleServiceError(error, 'Error fetching bookings for date range');
    }
  }

  /**
   * Conference session or campsite date availability for staff / public checks.
   */
  async getFacilityAvailability(
    propertyId: string,
    kind: 'conference' | 'campsite',
    from: string,
    to: string
  ): Promise<{ available: boolean; blockedDates?: string[] }> {
    if (kind === 'conference') {
      const rows = await db.execute(sql`
        SELECT check_in_date::text AS d FROM bookings
        WHERE property_id = ${propertyId}
          AND booking_kind = 'conference'
          AND status IN ('confirmed', 'checked_in')
          AND check_in_date >= ${from}::date
          AND check_in_date <= ${to}::date
      `);
      const blocked = (rows.rows as { d: string }[]).map((r) => r.d);
      return { available: blocked.length === 0, blockedDates: blocked };
    }

    const rows = await db.execute(sql`
      SELECT check_in_date::text AS start_d, check_out_date::text AS end_d
      FROM bookings
      WHERE property_id = ${propertyId}
        AND booking_kind = 'campsite'
        AND status IN ('confirmed', 'checked_in')
        AND check_in_date < ${to}::date
        AND check_out_date > ${from}::date
    `);
    const blocked = (rows.rows as { start_d: string; end_d: string }[]).map(
      (r) => `${r.start_d}–${r.end_d}`
    );
    return { available: blocked.length === 0, blockedDates: blocked };
  }

  /**
   * Create a new booking.
   */
  async createBooking(data: CreateBookingDTO): Promise<Booking> {
    try {
      const roomRows = await db.execute(sql`
        SELECT r.id, r.property_id, r.max_occupancy, r.inventory_kind, r.base_rate, p.tenant_id
        FROM rooms r
        JOIN properties p ON p.id = r.property_id
        WHERE r.id = ${data.roomId}
        LIMIT 1
      `);
      const room = roomRows.rows[0] as
        | {
            id: string;
            property_id: string;
            max_occupancy: number;
            inventory_kind: string;
            base_rate: string | null;
            tenant_id: string;
          }
        | undefined;
      if (!room) {
        throw new AppError(404, 'Room not found.');
      }
      if (room.inventory_kind && room.inventory_kind !== 'guest_room') {
        throw new AppError(400, 'Selected room is not a guest room. Use facility booking for conference or campsite.');
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
            inArray(bookingsSchema.status, ['confirmed', 'checked_in']),
            lt(bookingsSchema.checkInDate, data.checkOutDate.toISOString().slice(0, 10)),
            gt(bookingsSchema.checkOutDate, data.checkInDate.toISOString().slice(0, 10))
          )
        );

      if (conflictingBookings[0].value > 0) {
        throw new AppError(409, 'This room is already booked for the selected dates.');
      }

      const checkInStr = data.checkInDate.toISOString().slice(0, 10);
      const checkOutStr = data.checkOutDate.toISOString().slice(0, 10);
      // Price the stay from the room's nightly base rate (matches knowledge-base room rates).
      const ratePerNight = Number(room.base_rate ?? 0);
      const { total: stayTotal } = quoteStay(ratePerNight, nightsBetween(checkInStr, checkOutStr));
      const newBooking = await db.transaction(async (tx) => {
        const bookingResult = await tx.execute(sql`
          INSERT INTO bookings (
            id, tenant_id, property_id, guest_id, booking_reference, status, check_in_date, check_out_date, room_count, adult_count, child_count, total_amount, currency, payment_status, booking_kind, created_at, updated_at
          )
          VALUES (
            gen_random_uuid(),
            ${tenantId},
            ${room.property_id},
            ${data.guestId},
            ${`BR-${Date.now()}`},
            'confirmed',
            ${checkInStr},
            ${checkOutStr},
            1,
            ${data.numGuests},
            0,
            ${stayTotal.toFixed(2)},
            'NAD',
            'pending',
            'accommodation',
            NOW(),
            NOW()
          )
          RETURNING id, tenant_id, property_id, guest_id, booking_reference, status, check_in_date, check_out_date, room_count, adult_count, child_count, total_amount, currency, payment_status, booking_kind, created_at, updated_at
        `);

        const newBooking = this.normalizeBookingRow(bookingResult.rows[0] as any);

        await tx.execute(sql`
          INSERT INTO booking_rooms (id, booking_id, room_id, guest_count, rate_amount, currency, created_at)
          VALUES (gen_random_uuid(), ${newBooking.id}, ${data.roomId}, ${data.numGuests}, ${ratePerNight.toFixed(2)}, 'NAD', NOW())
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

      const nb = newBooking as Record<string, unknown>;
      scheduleBookingCreatedEffects({
        tenantId,
        bookingId: String(nb.id ?? ''),
        guestId: data.guestId,
        propertyId: room.property_id as string | null,
        bookingReference: String(nb.booking_reference ?? ''),
        checkInDate: checkInStr,
        checkOutDate: checkOutStr,
        bookingKind: 'accommodation',
        paymentStatus: String(nb.payment_status ?? 'pending'),
        totalAmount: Number.parseFloat(String(nb.total_amount ?? 0)) || 0,
      });

      const [bookingRow] = await db
        .select()
        .from(bookingsSchema)
        .where(eq(bookingsSchema.id, String(nb.id ?? '')))
        .limit(1);
      if (bookingRow) {
        await new FolioService().ensureBookingChargeForBooking(bookingRow);
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
   * Conference session or whole-site campsite booking.
   */
  async createFacilityBooking(data: CreateFacilityBookingDTO): Promise<Booking> {
    try {
      const roomRows = await db.execute(sql`
        SELECT r.id, r.property_id, r.inventory_kind, p.tenant_id
        FROM rooms r
        JOIN properties p ON p.id = r.property_id
        WHERE r.id = ${data.roomId}
        LIMIT 1
      `);
      const room = roomRows.rows[0] as
        | { id: string; property_id: string; inventory_kind: string; tenant_id: string }
        | undefined;
      if (!room) {
        throw new AppError(404, 'Facility not found.');
      }

      const expectedKind = data.bookingKind;
      if (room.inventory_kind !== expectedKind) {
        throw new AppError(400, `Room is not a ${expectedKind} offering.`);
      }

      const checkInStr = data.checkInDate.toISOString().slice(0, 10);
      const checkOutStr = data.checkOutDate.toISOString().slice(0, 10);

      if (data.bookingKind === 'conference') {
        if (checkInStr !== checkOutStr) {
          throw new AppError(400, 'Conference bookings use a single session date.');
        }
        const conflict = await db.execute(sql`
          SELECT COUNT(*)::int AS c FROM bookings
          WHERE property_id = ${room.property_id}
            AND booking_kind = 'conference'
            AND status IN ('confirmed', 'checked_in')
            AND check_in_date = ${checkInStr}::date
        `);
        if (Number((conflict.rows[0] as { c: number })?.c ?? 0) > 0) {
          throw new AppError(409, 'Conference hall is already booked for this date.');
        }
      } else {
        if (checkOutStr <= checkInStr) {
          throw new AppError(400, 'Campsite check-out must be after check-in.');
        }
        const namibian = data.namibianGuests ?? 0;
        const nonNamibian = data.nonNamibianGuests ?? 0;
        if (campsiteGuestTotal({ namibianGuests: namibian, nonNamibianGuests: nonNamibian }) < 1) {
          throw new AppError(400, 'At least one guest is required for the campsite.');
        }
        const conflict = await db.execute(sql`
          SELECT COUNT(*)::int AS c FROM bookings
          WHERE property_id = ${room.property_id}
            AND booking_kind = 'campsite'
            AND status IN ('confirmed', 'checked_in')
            AND check_in_date < ${checkOutStr}::date
            AND check_out_date > ${checkInStr}::date
        `);
        if (Number((conflict.rows[0] as { c: number })?.c ?? 0) > 0) {
          throw new AppError(409, 'Campsite is already booked for overlapping dates.');
        }
      }

      const pricingInput: CampsitePricingInput = {
        namibianGuests: data.namibianGuests ?? 0,
        nonNamibianGuests: data.nonNamibianGuests ?? 0,
      };
      const totalAmount =
        data.bookingKind === 'conference'
          ? calculateConferenceTotal()
          : calculateCampsiteTotal(pricingInput);

      const depositPercent =
        Number(data.pricingDetails?.depositPercent) || DEFAULT_BOOKING_DEPOSIT_PERCENT;
      const pricingDetails = withDepositPricingDetails(
        {
          ...(data.pricingDetails ?? {}),
          ...(data.bookingKind === 'campsite'
            ? {
                namibianGuests: pricingInput.namibianGuests,
                nonNamibianGuests: pricingInput.nonNamibianGuests,
              }
            : { sessionDate: checkInStr }),
        },
        totalAmount,
        depositPercent
      );

      const guestCount =
        data.bookingKind === 'campsite'
          ? campsiteGuestTotal(pricingInput)
          : 1;

      const tenantId = room.tenant_id;
      const newBooking = await db.transaction(async (tx) => {
        const bookingResult = await tx.execute(sql`
          INSERT INTO bookings (
            id, tenant_id, property_id, guest_id, booking_reference, status,
            check_in_date, check_out_date, room_count, adult_count, child_count,
            total_amount, deposit_percent, currency, payment_status, booking_kind, pricing_details,
            created_at, updated_at
          )
          VALUES (
            gen_random_uuid(),
            ${tenantId},
            ${room.property_id},
            ${data.guestId},
            ${`BR-${Date.now()}`},
            'confirmed',
            ${checkInStr},
            ${checkOutStr},
            1,
            ${guestCount},
            0,
            ${totalAmount},
            ${depositPercent},
            'NAD',
            'pending',
            ${data.bookingKind},
            ${JSON.stringify(pricingDetails)}::jsonb,
            NOW(),
            NOW()
          )
          RETURNING id, tenant_id, property_id, guest_id, booking_reference, status,
            check_in_date, check_out_date, total_amount, currency, payment_status,
            booking_kind, created_at, updated_at
        `);

        const created = this.normalizeBookingRow(bookingResult.rows[0] as Record<string, unknown>);

        await tx.execute(sql`
          INSERT INTO booking_rooms (id, booking_id, room_id, guest_count, rate_amount, currency, created_at)
          VALUES (gen_random_uuid(), ${created.id}, ${data.roomId}, ${guestCount}, ${totalAmount}, 'NAD', NOW())
        `);

        return created;
      });

      const nb = newBooking as Record<string, unknown>;
      if (data.guestId && room.property_id) {
        await crmGraphMemory.ensureEdge({
          tenantId,
          srcType: 'guest',
          srcId: data.guestId,
          dstType: 'property',
          dstId: room.property_id,
          relationType: 'booked_at',
          metadata: { bookingId: String(nb.id ?? ''), bookingKind: data.bookingKind },
        });
      }

      scheduleBookingCreatedEffects({
        tenantId,
        bookingId: String(nb.id ?? ''),
        guestId: data.guestId,
        propertyId: room.property_id,
        bookingReference: String(nb.booking_reference ?? ''),
        checkInDate: checkInStr,
        checkOutDate: checkOutStr,
        bookingKind: data.bookingKind,
      });

      const [facilityRow] = await db
        .select()
        .from(bookingsSchema)
        .where(eq(bookingsSchema.id, String(nb.id ?? '')))
        .limit(1);
      if (facilityRow) {
        await new FolioService().ensureBookingChargeForBooking(facilityRow);
      }

      return newBooking as Booking;
    } catch (error: unknown) {
      if (error instanceof AppError) {
        throw error;
      }
      throw handleServiceError(error, 'Error creating facility booking');
    }
  }

  /**
   * Get a booking by ID.
   */
  async getBookingById(bookingId: string, tenantId: string): Promise<BookingDetailsRow | null> {
    if (!UUID_PATTERN.test(bookingId)) return null;

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
          b.total_amount,
          b.currency,
          b.payment_status,
          b.payment_method,
          b.amount_tendered,
          b.change_given,
          b.receipt_number,
          b.special_requests,
          b.booking_kind,
          b.pricing_details,
          b.created_at,
          b.updated_at,
          (SELECT r.inventory_kind FROM booking_rooms br JOIN rooms r ON r.id = br.room_id
           WHERE br.booking_id = b.id LIMIT 1) AS inventory_kind,
          (SELECT r.room_type FROM booking_rooms br JOIN rooms r ON r.id = br.room_id
           WHERE br.booking_id = b.id LIMIT 1) AS room_type,
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
   * Desk / payments lookup — reference, guest name, or booking id.
   */
  async searchBookingsForDesk(
    tenantId: string,
    query: string,
    limit = 15
  ): Promise<
    Array<{
      id: string;
      bookingReference: string;
      status: string;
      checkInDate: string | null;
      checkOutDate: string | null;
      guestName: string;
    }>
  > {
    const trimmed = query.trim();
    if (!trimmed) return [];

    try {
      const like = `%${trimmed}%`;
      const matchId = UUID_PATTERN.test(trimmed) ? trimmed : null;
      const capped = Math.min(Math.max(limit, 1), 25);

      const rows = await db.execute(sql`
        SELECT
          b.id,
          b.booking_reference,
          b.status,
          b.check_in_date,
          b.check_out_date,
          g.first_name,
          g.last_name
        FROM bookings b
        LEFT JOIN guests g ON g.id = b.guest_id AND g.tenant_id = b.tenant_id
        WHERE b.tenant_id = ${tenantId}
          AND (
            (${matchId}::text IS NOT NULL AND b.id::text = ${matchId})
            OR b.booking_reference ILIKE ${like}
            OR g.first_name ILIKE ${like}
            OR g.last_name ILIKE ${like}
            OR CONCAT(COALESCE(g.first_name, ''), ' ', COALESCE(g.last_name, '')) ILIKE ${like}
          )
        ORDER BY b.check_in_date DESC
        LIMIT ${capped}
      `);

      return (rows.rows as Array<Record<string, unknown>>).map((row) => ({
        id: String(row.id),
        bookingReference: String(row.booking_reference ?? ''),
        status: String(row.status ?? '').toLowerCase(),
        checkInDate: row.check_in_date ? String(row.check_in_date).slice(0, 10) : null,
        checkOutDate: row.check_out_date ? String(row.check_out_date).slice(0, 10) : null,
        guestName: [row.first_name, row.last_name].filter(Boolean).join(' ').trim() || 'Guest',
      }));
    } catch (error) {
      throw handleServiceError(error, 'Error searching bookings');
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
            eq(roomsSchema.inventoryKind, 'guest_room'),
            notInArray(roomsSchema.status, ['out_of_order', 'OUT_OF_ORDER', 'maintenance']),
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

      const currentStatus = (booking.status || 'pending') as ReservationStatus;
      const normalizedTarget = targetStatus.trim().toLowerCase() as ReservationStatus;
      assertTransition(currentStatus, normalizedTarget);

      const out = await invokeLifecycleTransition(
        'booking',
        BOOKING_STATUS_TRANSITIONS,
        currentStatus,
        normalizedTarget
      );

      if (out.errorMessage || !out.resolvedStatus) {
        throw new AppError(400, out.errorMessage || 'Invalid status transition');
      }

      const next = out.resolvedStatus;
      const now = new Date();

      if (next === 'checked_out') {
        const folioService = new FolioService();
        const folio = await folioService.getFolio(bookingId);
        if (folio.balanceDue > 0 && !folio.folioClosedAt) {
          throw new AppError(
            409,
            `Cannot check out: folio balance ${folio.currency} ${folio.balanceDue.toFixed(2)} is still open. Settle the stay folio first.`
          );
        }
      }

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

        const skipRoomStatus = isFacilityBookingKind(booking.bookingKind);
        if (!skipRoomStatus) {
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

      scheduleBookingTransitionEffects({
        tenantId,
        booking: updated,
        previousStatus: booking.status ?? undefined,
        nextStatus: next,
      });

      return updated;
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw handleServiceError(error, 'transition booking status');
    }
  }
}
