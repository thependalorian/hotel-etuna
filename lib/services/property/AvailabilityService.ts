/**
 * AvailabilityService - Room availability checks using Drizzle
 * Purpose: Check room availability and fetch available rooms for a property/date range
 * Location: lib/services/property/AvailabilityService.ts
 */

import { db } from '@/lib/db';
import { bookings, bookingRooms, rooms } from '@/lib/db/schema';
import { and, eq, lt, gt, notInArray, sql } from 'drizzle-orm';
import type { Room } from '@/lib/db/schema';
import { AppError, handleServiceError } from '@/lib/utils/errors';

const EXCLUDED_BOOKING_STATUSES = ['cancelled', 'no_show'] as const;

function toDateString(d: Date): string {
  return d.toISOString().slice(0, 10);
}

export class AvailabilityService {
  async checkRoomAvailability(roomId: string, checkInDate: Date, checkOutDate: Date): Promise<boolean> {
    try {
      const checkInStr = toDateString(checkInDate);
      const checkOutStr = toDateString(checkOutDate);

      const conflicting = await db
        .select({ count: sql<number>`count(*)::int` })
        .from(bookings)
        .innerJoin(bookingRooms, eq(bookings.id, bookingRooms.bookingId))
        .where(
          and(
            eq(bookingRooms.roomId, roomId),
            notInArray(bookings.status, [...EXCLUDED_BOOKING_STATUSES]),
            lt(bookings.checkInDate, checkOutStr),
            gt(bookings.checkOutDate, checkInStr)
          )
        );

      const count = Number(conflicting[0]?.count ?? 0);
      return count === 0;
    } catch (error) {
      throw handleServiceError(error, 'Error checking room availability');
    }
  }

  async getAvailableRooms(propertyId: string, checkInDate: Date, checkOutDate: Date): Promise<Room[]> {
    try {
      const checkInStr = toDateString(checkInDate);
      const checkOutStr = toDateString(checkOutDate);

      const allRooms = await db
        .select()
        .from(rooms)
        .where(
          and(
            eq(rooms.propertyId, propertyId),
            sql`${rooms.status} IS DISTINCT FROM 'OUT_OF_ORDER'`
          )
        );

      const bookedRoomRows = await db
        .select({ roomId: bookingRooms.roomId })
        .from(bookings)
        .innerJoin(bookingRooms, eq(bookings.id, bookingRooms.bookingId))
        .where(
          and(
            eq(bookings.propertyId, propertyId),
            notInArray(bookings.status, [...EXCLUDED_BOOKING_STATUSES]),
            lt(bookings.checkInDate, checkOutStr),
            gt(bookings.checkOutDate, checkInStr)
          )
        );

      const bookedRoomIds = new Set(bookedRoomRows.map((r) => r.roomId));
      return allRooms.filter((room) => !bookedRoomIds.has(room.id));
    } catch (error) {
      throw handleServiceError(error, 'Error fetching available rooms');
    }
  }
}
