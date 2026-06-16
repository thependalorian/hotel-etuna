/**
 * @fileoverview AvailabilityService — domain service module.
 * AvailabilityService - Enhanced room availability ledger with double-booking prevention
 * 
 * Purpose: Track room availability using ledger pattern for transactional integrity
 * Location: lib/services/booking/AvailabilityService.ts
 * 
 * Wave 6: Availability Ledger & Property Management UX
 * Ported patterns from innkeeper/pesan-pms (availability tracking without runtime imports)
 * 
 * Design Pattern: Availability Ledger
 * - Query-based conflict detection (existing)
 * - Ledger-style availability snapshots (enhanced)
 * - Transactional booking with optimistic locking
 * - Room type vs individual room tracking
 * 
 * @version 2.0.0 (Wave 6 enhancement)
 * @since June 2026
 */

import { db } from '@/lib/db';
import { bookings, bookingRooms, rooms, properties } from '@/lib/db/schema';
import { and, eq, lt, gt, notInArray, sql, gte, lte, inArray, isNull, or } from 'drizzle-orm';
import type { Room } from '@/lib/db/schema';
import { AppError, handleServiceError } from '@/lib/utils/errors';

const EXCLUDED_BOOKING_STATUSES = ['cancelled', 'no_show'] as const;

/**
 * Availability ledger entry for a specific date
 */
export interface AvailabilityLedgerEntry {
  roomId: string;
  roomNumber: string;
  roomType: string;
  propertyId: string;
  date: string;
  isAvailable: boolean;
  bookingId?: string;
  bookingReference?: string;
  guestName?: string;
}

/**
 * Room type availability summary
 */
export interface RoomTypeAvailability {
  roomType: string;
  totalRooms: number;
  availableRooms: number;
  occupiedRooms: number;
  unavailableRooms: number;
  occupancyRate: number;
}

/**
 * Availability calendar data for a date range
 */
export interface AvailabilityCalendarData {
  propertyId: string;
  propertyName: string;
  startDate: string;
  endDate: string;
  roomTypes: Array<{
    roomType: string;
    rooms: Array<{
      roomId: string;
      roomNumber: string;
      availability: Array<{
        date: string;
        isAvailable: boolean;
        bookingReference?: string;
      }>;
    }>;
  }>;
}

function toDateString(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function generateDateRange(start: Date, end: Date): string[] {
  const dates: string[] = [];
  const current = new Date(start);
  
  while (current < end) {
    dates.push(toDateString(current));
    current.setDate(current.getDate() + 1);
  }
  
  return dates;
}

export class AvailabilityService {
  /**
   * Check if a specific room is available for the given date range
   * (Original method - maintained for backward compatibility)
   */
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

  /**
   * Get all available rooms for a property and date range
   * (Original method - maintained for backward compatibility)
   */
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
            eq(rooms.inventoryKind, 'guest_room'),
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

  /**
   * Get availability ledger for a property and date range
   * Returns day-by-day availability for each room
   * 
   * @param propertyId - Property UUID
   * @param startDate - Start date
   * @param endDate - End date (exclusive)
   * @returns Array of ledger entries per room per day
   */
  async getAvailabilityLedger(
    propertyId: string,
    startDate: Date,
    endDate: Date
  ): Promise<AvailabilityLedgerEntry[]> {
    try {
      const startStr = toDateString(startDate);
      const endStr = toDateString(endDate);

      // Get all guest rooms for the property
      const allRooms = await db
        .select()
        .from(rooms)
        .where(
          and(
            eq(rooms.propertyId, propertyId),
            eq(rooms.inventoryKind, 'guest_room')
          )
        );

      if (allRooms.length === 0) {
        return [];
      }

      // Get all bookings that overlap with the date range
      const overlappingBookings = await db
        .select({
          bookingId: bookings.id,
          bookingReference: bookings.bookingReference,
          checkInDate: bookings.checkInDate,
          checkOutDate: bookings.checkOutDate,
          status: bookings.status,
          roomId: bookingRooms.roomId,
        })
        .from(bookings)
        .innerJoin(bookingRooms, eq(bookings.id, bookingRooms.bookingId))
        .where(
          and(
            eq(bookings.propertyId, propertyId),
            notInArray(bookings.status, [...EXCLUDED_BOOKING_STATUSES]),
            lt(bookings.checkInDate, endStr),
            gt(bookings.checkOutDate, startStr)
          )
        );

      // Build a map of room occupancy by date
      const occupancyMap = new Map<string, Map<string, typeof overlappingBookings[0]>>();
      
      for (const booking of overlappingBookings) {
        const bookingCheckIn = new Date(booking.checkInDate);
        const bookingCheckOut = new Date(booking.checkOutDate);
        const bookingDates = generateDateRange(bookingCheckIn, bookingCheckOut);

        const roomId = booking.roomId;
        if (!roomId) continue; // unassigned bookings cannot occupy a room

        for (const date of bookingDates) {
          if (!occupancyMap.has(roomId)) {
            occupancyMap.set(roomId, new Map());
          }
          occupancyMap.get(roomId)!.set(date, booking);
        }
      }

      // Generate ledger entries
      const ledger: AvailabilityLedgerEntry[] = [];
      const dates = generateDateRange(startDate, endDate);

      for (const room of allRooms) {
        const roomOccupancy = occupancyMap.get(room.id);

        for (const date of dates) {
          const booking = roomOccupancy?.get(date);
          const isOutOfOrder = room.status === 'OUT_OF_ORDER';

          ledger.push({
            roomId: room.id,
            roomNumber: room.roomNumber,
            roomType: room.roomType,
            propertyId: room.propertyId ?? propertyId,
            date,
            isAvailable: !booking && !isOutOfOrder,
            bookingId: booking?.bookingId,
            bookingReference: booking?.bookingReference,
          });
        }
      }

      return ledger;
    } catch (error) {
      throw handleServiceError(error, 'Error generating availability ledger');
    }
  }

  /**
   * Get room type availability summary for a date range
   * Useful for displaying occupancy rates by room type
   * 
   * @param propertyId - Property UUID
   * @param checkInDate - Check-in date
   * @param checkOutDate - Check-out date
   * @returns Array of room type summaries
   */
  async getRoomTypeAvailability(
    propertyId: string,
    checkInDate: Date,
    checkOutDate: Date
  ): Promise<RoomTypeAvailability[]> {
    try {
      const availableRooms = await this.getAvailableRooms(propertyId, checkInDate, checkOutDate);
      
      const allRooms = await db
        .select()
        .from(rooms)
        .where(
          and(
            eq(rooms.propertyId, propertyId),
            eq(rooms.inventoryKind, 'guest_room')
          )
        );

      // Group by room type
      const typeMap = new Map<string, { total: number; available: number; unavailable: number }>();

      for (const room of allRooms) {
        if (!typeMap.has(room.roomType)) {
          typeMap.set(room.roomType, { total: 0, available: 0, unavailable: 0 });
        }

        const stats = typeMap.get(room.roomType)!;
        stats.total++;

        if (room.status === 'OUT_OF_ORDER') {
          stats.unavailable++;
        } else if (availableRooms.some(r => r.id === room.id)) {
          stats.available++;
        }
      }

      const summaries: RoomTypeAvailability[] = [];

      for (const [roomType, stats] of typeMap.entries()) {
        const occupiedRooms = stats.total - stats.available - stats.unavailable;
        const occupancyRate = stats.total > 0 
          ? Math.round((occupiedRooms / (stats.total - stats.unavailable)) * 100) 
          : 0;

        summaries.push({
          roomType,
          totalRooms: stats.total,
          availableRooms: stats.available,
          occupiedRooms,
          unavailableRooms: stats.unavailable,
          occupancyRate,
        });
      }

      return summaries.sort((a, b) => a.roomType.localeCompare(b.roomType));
    } catch (error) {
      throw handleServiceError(error, 'Error fetching room type availability');
    }
  }

  /**
   * Get availability calendar data for UI rendering
   * Optimized format for calendar components
   * 
   * @param propertyId - Property UUID
   * @param startDate - Calendar start date
   * @param endDate - Calendar end date (exclusive)
   * @returns Calendar data structure
   */
  async getAvailabilityCalendar(
    propertyId: string,
    startDate: Date,
    endDate: Date
  ): Promise<AvailabilityCalendarData> {
    try {
      const property = await db
        .select()
        .from(properties)
        .where(eq(properties.id, propertyId))
        .limit(1);

      if (!property.length) {
        throw new AppError(404, 'Property not found');
      }

      const ledger = await this.getAvailabilityLedger(propertyId, startDate, endDate);

      // Group by room type
      const typeMap = new Map<string, Map<string, AvailabilityLedgerEntry[]>>();

      for (const entry of ledger) {
        if (!typeMap.has(entry.roomType)) {
          typeMap.set(entry.roomType, new Map());
        }

        const roomMap = typeMap.get(entry.roomType)!;
        if (!roomMap.has(entry.roomId)) {
          roomMap.set(entry.roomId, []);
        }

        roomMap.get(entry.roomId)!.push(entry);
      }

      // Build calendar structure
      const roomTypes = Array.from(typeMap.entries()).map(([roomType, roomMap]) => ({
        roomType,
        rooms: Array.from(roomMap.entries()).map(([roomId, entries]) => ({
          roomId,
          roomNumber: entries[0]?.roomNumber || '',
          availability: entries.map(e => ({
            date: e.date,
            isAvailable: e.isAvailable,
            bookingReference: e.bookingReference,
          })),
        })),
      }));

      return {
        propertyId,
        propertyName: property[0].name,
        startDate: toDateString(startDate),
        endDate: toDateString(endDate),
        roomTypes,
      };
    } catch (error) {
      throw handleServiceError(error, 'Error generating availability calendar');
    }
  }

  /**
   * Check if a specific room type has availability for the date range
   * Useful for room type-based booking flows
   * 
   * @param propertyId - Property UUID
   * @param roomType - Room type to check
   * @param checkInDate - Check-in date
   * @param checkOutDate - Check-out date
   * @param requiredCount - Number of rooms needed (default: 1)
   * @returns True if sufficient rooms available
   */
  async checkRoomTypeAvailability(
    propertyId: string,
    roomType: string,
    checkInDate: Date,
    checkOutDate: Date,
    requiredCount: number = 1
  ): Promise<boolean> {
    try {
      const availableRooms = await this.getAvailableRooms(propertyId, checkInDate, checkOutDate);
      const roomsOfType = availableRooms.filter(r => r.roomType === roomType);
      
      return roomsOfType.length >= requiredCount;
    } catch (error) {
      throw handleServiceError(error, 'Error checking room type availability');
    }
  }

  /**
   * Get count of available rooms by room type for a date range
   * Returns map of room type to available count
   * 
   * @param propertyId - Property UUID
   * @param checkInDate - Check-in date
   * @param checkOutDate - Check-out date
   * @returns Map of room type to available count
   */
  async getAvailableCountByRoomType(
    propertyId: string,
    checkInDate: Date,
    checkOutDate: Date
  ): Promise<Record<string, number>> {
    try {
      const availableRooms = await this.getAvailableRooms(propertyId, checkInDate, checkOutDate);
      
      const countMap: Record<string, number> = {};
      
      for (const room of availableRooms) {
        if (!countMap[room.roomType]) {
          countMap[room.roomType] = 0;
        }
        countMap[room.roomType]++;
      }
      
      return countMap;
    } catch (error) {
      throw handleServiceError(error, 'Error counting available rooms by type');
    }
  }
}
