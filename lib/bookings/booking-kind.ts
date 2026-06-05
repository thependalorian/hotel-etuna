/**
 * Booking kind helpers — accommodation vs conference vs campsite.
 * Location: lib/bookings/booking-kind.ts
 */

import { eq, inArray, or, isNull, SQL } from 'drizzle-orm';
import { bookings } from '@/lib/db/schema';

export type BookingKind = 'accommodation' | 'conference' | 'campsite';

export const BOOKING_KINDS: BookingKind[] = ['accommodation', 'conference', 'campsite'];

export const FACILITY_BOOKING_KINDS: BookingKind[] = ['conference', 'campsite'];

export function normalizeBookingKind(
  kind: string | null | undefined
): BookingKind {
  if (kind === 'conference' || kind === 'campsite') return kind;
  return 'accommodation';
}

export function isAccommodationBookingKind(
  kind: string | null | undefined
): boolean {
  return normalizeBookingKind(kind) === 'accommodation';
}

export function isFacilityBookingKind(kind: string | null | undefined): boolean {
  return kind === 'conference' || kind === 'campsite';
}

/** Drizzle: accommodation stays (legacy null → accommodation). */
export function accommodationBookingCondition(): SQL {
  return or(
    eq(bookings.bookingKind, 'accommodation'),
    isNull(bookings.bookingKind)
  )!;
}

/** Drizzle: conference or campsite. */
export function facilityBookingCondition(): SQL {
  return inArray(bookings.bookingKind, FACILITY_BOOKING_KINDS);
}

export function bookingKindLabel(kind: string | null | undefined): string {
  switch (normalizeBookingKind(kind)) {
    case 'conference':
      return 'Conference';
    case 'campsite':
      return 'Campsite';
    default:
      return 'Room stay';
  }
}

export function bookingKindBadgeClass(kind: string | null | undefined): string {
  switch (normalizeBookingKind(kind)) {
    case 'conference':
      return 'badge badge-info badge-soft';
    case 'campsite':
      return 'badge badge-secondary badge-soft';
    default:
      return 'badge badge-primary badge-soft';
  }
}

export function checkInDateLabel(kind: string | null | undefined): string {
  return isFacilityBookingKind(kind) && kind === 'conference' ? 'Session date' : 'Check-in';
}

export function checkOutDateLabel(kind: string | null | undefined): string {
  if (kind === 'conference') return 'Session end';
  if (kind === 'campsite') return 'Check-out';
  return 'Check-out';
}

/**
 * Expand a booking into ISO date strings (YYYY-MM-DD) for calendar occupancy.
 * Conference same-day sessions count as one day.
 */
export function expandBookingDateStrings(
  checkIn: string | Date,
  checkOut: string | Date | null | undefined,
  bookingKind: string | null | undefined
): string[] {
  const start = toDateOnly(checkIn);
  const end = toDateOnly(checkOut ?? checkIn);
  const kind = normalizeBookingKind(bookingKind);

  if (kind === 'conference' || start === end) {
    return [start];
  }

  const dates: string[] = [];
  let current = parseDateOnly(start);
  const endDate = parseDateOnly(end);
  while (current < endDate) {
    dates.push(formatDateOnly(current));
    current = addDays(current, 1);
  }
  return dates.length > 0 ? dates : [start];
}

function toDateOnly(value: string | Date): string {
  if (typeof value === 'string') {
    return value.slice(0, 10);
  }
  return formatDateOnly(value);
}

function parseDateOnly(iso: string): Date {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d);
}

function formatDateOnly(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function addDays(d: Date, n: number): Date {
  const next = new Date(d);
  next.setDate(next.getDate() + n);
  return next;
}
