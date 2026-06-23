/**
 * @fileoverview ForecastingService — in-house, deterministic occupancy/ADR/RevPAR forecast.
 * Location: lib/services/intelligence/ForecastingService.ts
 *
 * Our stack is TypeScript/Node — we cannot run the R `fable`/`rugarch` models from the
 * FPP3 reference, so this is a pragmatic revenue-management forecast: forward "on-the-books"
 * occupancy per room type over a horizon, trailing ADR, and RevPAR = ADR × occupancy.
 * It produces NUMBERS ONLY — turning them into rate suggestions (and requiring human approval)
 * is RateRecommendationService's job. Reason: keep the math pure and unit-testable.
 */
import {
  db,
  rooms as roomsSchema,
  bookings as bookingsSchema,
  bookingRooms as bookingRoomsSchema,
  and,
  eq,
  inArray,
  gte,
  lt,
} from '@/lib/db';
import { handleServiceError } from '@/lib/utils/errors';
import { nightsBetween } from '@/lib/services/booking/stay-pricing';

/** Active booking statuses that occupy inventory. */
const ACTIVE_STATUSES = ['confirmed', 'assigned', 'checked_in', 'stayover'] as const;

export type RoomTypeForecast = {
  roomType: string;
  roomCount: number;
  baseRate: number;
  capacityNights: number;
  bookedNights: number;
  forecastOccupancy: number; // 0..1
  adr: number; // trailing average daily rate (NAD)
  revpar: number; // adr × occupancy
};

export type OccupancyForecast = {
  propertyId: string | null;
  horizonDays: number;
  windowStart: string; // YYYY-MM-DD
  windowEnd: string; // YYYY-MM-DD
  overallOccupancy: number; // 0..1
  byRoomType: RoomTypeForecast[];
};

function ymd(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function clampNights(checkIn: string, checkOut: string, windowStart: string, windowEnd: string): number {
  const start = checkIn > windowStart ? checkIn : windowStart;
  const end = checkOut < windowEnd ? checkOut : windowEnd;
  return Math.max(0, nightsBetween(start, end));
}

export class ForecastingService {
  /**
   * Forward occupancy/ADR/RevPAR per room type over the next `horizonDays`.
   * @param input - tenant + optional property + horizon (defaults to 30 days).
   * @returns Per-room-type forecast plus an overall occupancy rate.
   */
  async getOccupancyForecast(input: {
    tenantId: string;
    propertyId?: string | null;
    horizonDays?: number;
  }): Promise<OccupancyForecast> {
    try {
      const horizonDays = Math.max(1, Math.min(365, input.horizonDays ?? 30));
      const now = new Date();
      const windowStart = ymd(now);
      const windowEnd = ymd(new Date(now.getTime() + horizonDays * 86_400_000));

      // 1. Bookable guest rooms (optionally scoped to a property).
      const roomWhere = input.propertyId
        ? and(eq(roomsSchema.propertyId, input.propertyId), eq(roomsSchema.inventoryKind, 'guest_room'))
        : eq(roomsSchema.inventoryKind, 'guest_room');
      const roomRows = await db
        .select({
          id: roomsSchema.id,
          roomType: roomsSchema.roomType,
          baseRate: roomsSchema.baseRate,
        })
        .from(roomsSchema)
        .where(roomWhere);

      const roomTypeOf = new Map<string, string>();
      const byType = new Map<string, RoomTypeForecast>();
      for (const r of roomRows) {
        roomTypeOf.set(r.id, r.roomType);
        const existing = byType.get(r.roomType);
        if (existing) {
          existing.roomCount += 1;
          existing.capacityNights += horizonDays;
        } else {
          byType.set(r.roomType, {
            roomType: r.roomType,
            roomCount: 1,
            baseRate: Number(r.baseRate ?? 0),
            capacityNights: horizonDays,
            bookedNights: 0,
            forecastOccupancy: 0,
            adr: 0,
            revpar: 0,
          });
        }
      }

      // 2. On-the-books bookings overlapping the window → booked room-nights per type.
      const bookingRows = await db
        .select({
          checkInDate: bookingsSchema.checkInDate,
          checkOutDate: bookingsSchema.checkOutDate,
          totalAmount: bookingsSchema.totalAmount,
          roomId: bookingRoomsSchema.roomId,
        })
        .from(bookingsSchema)
        .innerJoin(bookingRoomsSchema, eq(bookingsSchema.id, bookingRoomsSchema.bookingId))
        .where(
          and(
            eq(bookingsSchema.tenantId, input.tenantId),
            inArray(bookingsSchema.status, [...ACTIVE_STATUSES]),
            lt(bookingsSchema.checkInDate, windowEnd),
            gte(bookingsSchema.checkOutDate, windowStart),
          ),
        );

      let totalBookedNights = 0;
      for (const b of bookingRows) {
        if (!b.roomId || !b.checkInDate || !b.checkOutDate) continue;
        const roomType = roomTypeOf.get(b.roomId);
        if (!roomType) continue; // room not in scope (other property)
        const nights = clampNights(b.checkInDate, b.checkOutDate, windowStart, windowEnd);
        if (nights <= 0) continue;
        const entry = byType.get(roomType);
        if (!entry) continue;
        entry.bookedNights += nights;
        totalBookedNights += nights;
      }

      // 3. Trailing ADR (last 90 days of revenue-producing bookings) per room type.
      const adrByType = await this.trailingAdrByRoomType(input.tenantId, roomTypeOf);

      let totalCapacity = 0;
      for (const entry of byType.values()) {
        entry.forecastOccupancy =
          entry.capacityNights > 0 ? entry.bookedNights / entry.capacityNights : 0;
        entry.adr = adrByType.get(entry.roomType) ?? entry.baseRate;
        entry.revpar = Math.round(entry.adr * entry.forecastOccupancy * 100) / 100;
        totalCapacity += entry.capacityNights;
      }

      return {
        propertyId: input.propertyId ?? null,
        horizonDays,
        windowStart,
        windowEnd,
        overallOccupancy: totalCapacity > 0 ? totalBookedNights / totalCapacity : 0,
        byRoomType: [...byType.values()].sort((a, b) => a.roomType.localeCompare(b.roomType)),
      };
    } catch (error) {
      throw handleServiceError(error, 'Error building occupancy forecast');
    }
  }

  /** Average realised nightly rate per room type over the trailing 90 days. */
  private async trailingAdrByRoomType(
    tenantId: string,
    roomTypeOf: Map<string, string>,
  ): Promise<Map<string, number>> {
    const since = ymd(new Date(Date.now() - 90 * 86_400_000));
    const rows = await db
      .select({
        checkInDate: bookingsSchema.checkInDate,
        checkOutDate: bookingsSchema.checkOutDate,
        totalAmount: bookingsSchema.totalAmount,
        roomId: bookingRoomsSchema.roomId,
      })
      .from(bookingsSchema)
      .innerJoin(bookingRoomsSchema, eq(bookingsSchema.id, bookingRoomsSchema.bookingId))
      .where(
        and(
          eq(bookingsSchema.tenantId, tenantId),
          inArray(bookingsSchema.status, ['checked_in', 'stayover', 'checked_out', 'completed']),
          gte(bookingsSchema.checkOutDate, since),
        ),
      );

    const sums = new Map<string, { revenue: number; nights: number }>();
    for (const r of rows) {
      if (!r.roomId || !r.checkInDate || !r.checkOutDate) continue;
      const roomType = roomTypeOf.get(r.roomId);
      if (!roomType) continue;
      const nights = nightsBetween(r.checkInDate, r.checkOutDate);
      if (nights <= 0) continue;
      const acc = sums.get(roomType) ?? { revenue: 0, nights: 0 };
      acc.revenue += Number(r.totalAmount ?? 0);
      acc.nights += nights;
      sums.set(roomType, acc);
    }

    const adr = new Map<string, number>();
    for (const [roomType, { revenue, nights }] of sums.entries()) {
      if (nights > 0) adr.set(roomType, Math.round((revenue / nights) * 100) / 100);
    }
    return adr;
  }
}

export const forecastingService = new ForecastingService();
