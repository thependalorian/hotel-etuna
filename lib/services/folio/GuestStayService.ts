/**
 * GuestStayService — guest-facing stay list and menu context
 *
 * Purpose: Resolve active stays for a guest email (room service / folio entry).
 * Location: /lib/services/folio/GuestStayService.ts
 */

import { db, bookings, bookingRooms, guestProfiles, guests, properties, rooms } from '@/lib/db';
import { FolioService } from '@/lib/services/folio/FolioService';
import type {
  GuestLoyaltyHubSummary,
  GuestPastStaySummary,
  GuestPaymentDueSummary,
  GuestStaySummary,
} from '@/lib/types/folio';
import { handleServiceError } from '@/lib/utils/errors';
import { and, eq, gte, inArray, lt, lte, ne, or, sql } from 'drizzle-orm';

const folioService = new FolioService();

export class GuestStayService {
  async listStaysForGuestEmail(email: string): Promise<GuestStaySummary[]> {
    try {
      const normalized = email.trim().toLowerCase();
      if (!normalized) return [];

      const today = new Date().toISOString().slice(0, 10);

      const rows = await db
        .select({
          booking: bookings,
          propertyName: properties.name,
          propertySlug: properties.slug,
        })
        .from(bookings)
        .innerJoin(guests, eq(bookings.guestId, guests.id))
        .innerJoin(properties, eq(bookings.propertyId, properties.id))
        .where(
          and(
            sql`lower(${guests.email}) = ${normalized}`,
            inArray(bookings.status, ['confirmed', 'checked_in']),
            lte(bookings.checkInDate, today),
            gte(bookings.checkOutDate, today)
          )
        )
        .orderBy(bookings.checkInDate);

      const summaries: GuestStaySummary[] = [];

      for (const row of rows) {
        const b = row.booking;
        if (!b.id || !b.propertyId) continue;

        const roomLinks = await db
          .select({ roomNumber: rooms.roomNumber })
          .from(bookingRooms)
          .innerJoin(rooms, eq(bookingRooms.roomId, rooms.id))
          .where(eq(bookingRooms.bookingId, b.id));

        const folio = await folioService.getFolio(b.id);

        summaries.push({
          bookingId: b.id,
          bookingReference: b.bookingReference,
          status: b.status ?? 'confirmed',
          checkInDate: String(b.checkInDate),
          checkOutDate: String(b.checkOutDate),
          propertyId: b.propertyId,
          propertyName: row.propertyName,
          propertySlug: row.propertySlug,
          roomNumbers: roomLinks.map((r) => r.roomNumber).filter(Boolean) as string[],
          balanceDue: folio.balanceDue,
          currency: folio.currency,
          paymentStatus: b.paymentStatus,
          totalAmount: Number.parseFloat(String(b.totalAmount ?? 0)) || 0,
        });
      }

      return summaries;
    } catch (error) {
      throw handleServiceError(error, 'Error listing guest stays');
    }
  }

  async listPaymentDueForGuestEmail(email: string): Promise<GuestPaymentDueSummary[]> {
    try {
      const normalized = email.trim().toLowerCase();
      if (!normalized) return [];

      const today = new Date().toISOString().slice(0, 10);

      const rows = await db
        .select({
          booking: bookings,
          propertyName: properties.name,
        })
        .from(bookings)
        .innerJoin(guests, eq(bookings.guestId, guests.id))
        .innerJoin(properties, eq(bookings.propertyId, properties.id))
        .where(
          and(
            sql`lower(${guests.email}) = ${normalized}`,
            eq(bookings.status, 'confirmed'),
            eq(bookings.paymentStatus, 'pending'),
            gte(bookings.checkOutDate, today),
            sql`COALESCE(${bookings.totalAmount}::numeric, 0) > 0`
          )
        )
        .orderBy(bookings.checkInDate);

      return rows
        .filter((row) => row.booking.id)
        .map((row) => {
          const b = row.booking;
          return {
            bookingId: b.id!,
            bookingReference: b.bookingReference ?? '',
            checkInDate: String(b.checkInDate),
            checkOutDate: String(b.checkOutDate),
            propertyName: row.propertyName,
            totalAmount: Number.parseFloat(String(b.totalAmount ?? 0)) || 0,
            currency: b.currency ?? 'NAD',
            paymentStatus: b.paymentStatus ?? 'pending',
          };
        });
    } catch (error) {
      throw handleServiceError(error, 'Error listing payment due bookings');
    }
  }

  async listPastStaysForGuestEmail(email: string): Promise<GuestPastStaySummary[]> {
    try {
      const normalized = email.trim().toLowerCase();
      if (!normalized) return [];

      const today = new Date().toISOString().slice(0, 10);

      const rows = await db
        .select({
          booking: bookings,
          propertyName: properties.name,
          propertySlug: properties.slug,
        })
        .from(bookings)
        .innerJoin(guests, eq(bookings.guestId, guests.id))
        .innerJoin(properties, eq(bookings.propertyId, properties.id))
        .where(
          and(
            sql`lower(${guests.email}) = ${normalized}`,
            ne(bookings.status, 'cancelled'),
            or(eq(bookings.status, 'checked_out'), lt(bookings.checkOutDate, today))
          )
        )
        .orderBy(bookings.checkOutDate);

      const summaries: GuestPastStaySummary[] = [];

      for (const row of rows) {
        const b = row.booking;
        if (!b.id || !b.propertyId) continue;

        const roomLinks = await db
          .select({ roomNumber: rooms.roomNumber })
          .from(bookingRooms)
          .innerJoin(rooms, eq(bookingRooms.roomId, rooms.id))
          .where(eq(bookingRooms.bookingId, b.id));

        summaries.push({
          bookingId: b.id,
          bookingReference: b.bookingReference ?? '',
          status: b.status ?? 'checked_out',
          checkInDate: String(b.checkInDate),
          checkOutDate: String(b.checkOutDate),
          propertyId: b.propertyId,
          propertyName: row.propertyName,
          propertySlug: row.propertySlug,
          roomNumbers: roomLinks.map((r) => r.roomNumber).filter(Boolean) as string[],
          currency: b.currency ?? 'NAD',
        });
      }

      return summaries;
    } catch (error) {
      throw handleServiceError(error, 'Error listing past guest stays');
    }
  }

  async getLoyaltySummaryForGuestEmail(email: string): Promise<GuestLoyaltyHubSummary | null> {
    try {
      const normalized = email.trim().toLowerCase();
      if (!normalized) return null;

      const rows = await db
        .select({
          loyaltyPoints: guestProfiles.loyaltyPoints,
          loyaltyTier: guestProfiles.loyaltyTier,
        })
        .from(guestProfiles)
        .innerJoin(guests, eq(guestProfiles.guestId, guests.id))
        .where(sql`lower(${guests.email}) = ${normalized}`);

      if (rows.length === 0) return null;

      const loyaltyPoints = rows.reduce((sum, r) => sum + (r.loyaltyPoints ?? 0), 0);
      const tierOrder = ['bronze', 'silver', 'gold', 'platinum'];
      let loyaltyTier = 'bronze';
      for (const tier of [...tierOrder].reverse()) {
        if (rows.some((r) => (r.loyaltyTier ?? 'bronze').toLowerCase() === tier)) {
          loyaltyTier = tier;
          break;
        }
      }

      return {
        loyaltyPoints,
        loyaltyTier,
        profileCount: rows.length,
      };
    } catch (error) {
      throw handleServiceError(error, 'Error loading guest loyalty summary');
    }
  }

  async findGuestBookingAccess(
    email: string,
    bookingId: string
  ): Promise<GuestStaySummary | GuestPaymentDueSummary | GuestPastStaySummary | null> {
    const active = await this.listStaysForGuestEmail(email);
    const found = active.find((s) => s.bookingId === bookingId);
    if (found) return found;

    const due = await this.listPaymentDueForGuestEmail(email);
    const dueFound = due.find((b) => b.bookingId === bookingId);
    if (dueFound) return dueFound;

    const past = await this.listPastStaysForGuestEmail(email);
    return past.find((s) => s.bookingId === bookingId) ?? null;
  }
}
