/**
 * GuestStayService — guest-facing stay list and menu context
 *
 * Purpose: Resolve active stays for a guest email (room service / folio entry).
 * Location: /lib/services/folio/GuestStayService.ts
 */

import { db, bookings, bookingRooms, guests, properties, rooms } from '@/lib/db';
import { FolioService } from '@/lib/services/folio/FolioService';
import type { GuestPaymentDueSummary, GuestStaySummary } from '@/lib/types/folio';
import { handleServiceError } from '@/lib/utils/errors';
import { and, eq, gte, inArray, lte, sql } from 'drizzle-orm';

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

  async findGuestBookingAccess(
    email: string,
    bookingId: string
  ): Promise<GuestStaySummary | GuestPaymentDueSummary | null> {
    const active = await this.listStaysForGuestEmail(email);
    const found = active.find((s) => s.bookingId === bookingId);
    if (found) return found;

    const due = await this.listPaymentDueForGuestEmail(email);
    return due.find((b) => b.bookingId === bookingId) ?? null;
  }
}
