/**
 * Guest stay access checks
 *
 * Purpose: Verify a user may act on a booking (guest email match or hub staff).
 * Location: /lib/services/folio/guestStayAccess.ts
 */

import { db, bookings, guests } from '@/lib/db';
import { eq } from 'drizzle-orm';
import { AppError } from '@/lib/utils/errors';
import type { Booking, Guest } from '@/lib/db/schema';

const STAFF_ROLES = new Set(['owner', 'manager', 'admin', 'staff']);

export type BookingWithGuest = {
  booking: Booking;
  guest: Guest;
};

export type StayAccessUser = {
  email?: string | null;
  primaryEmail?: string | null;
  role?: string | null;
  tenantId?: string | null;
};

export async function loadBookingWithGuest(bookingId: string): Promise<BookingWithGuest> {
  const rows = await db
    .select({ booking: bookings, guest: guests })
    .from(bookings)
    .innerJoin(guests, eq(bookings.guestId, guests.id))
    .where(eq(bookings.id, bookingId))
    .limit(1);

  const row = rows[0];
  if (!row?.booking || !row.guest) {
    throw new AppError(404, 'Booking not found');
  }
  return { booking: row.booking, guest: row.guest };
}

export function assertCheckedIn(booking: Booking): void {
  if (booking.status !== 'checked_in') {
    throw new AppError(
      400,
      'Room service and folio settlement require an active stay (checked in)'
    );
  }
}

export async function assertStayAccess(
  bookingId: string,
  user: StayAccessUser
): Promise<BookingWithGuest> {
  const ctx = await loadBookingWithGuest(bookingId);
  const email = (user.primaryEmail || user.email || '').toLowerCase();
  const guestEmail = (ctx.guest.email || '').toLowerCase();
  const role = (user.role || '').toLowerCase();
  const isStaff = STAFF_ROLES.has(role);

  if (isStaff && user.tenantId && user.tenantId === ctx.booking.tenantId) {
    return ctx;
  }

  if (email && guestEmail && email === guestEmail) {
    return ctx;
  }

  throw new AppError(403, 'You do not have access to this stay');
}
