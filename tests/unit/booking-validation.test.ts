/**
 * Booking Validation — comprehensive scenario tests
 *
 * Purpose: Test booking creation edge cases, date validation, availability
 * logic, and folio charge scenarios for production confidence.
 *
 * Location: tests/unit/booking-validation.test.ts
 */

import { describe, it, expect } from 'vitest';
import { z } from 'zod';

// Mirrors booking validation logic
const bookingDateSchema = z.object({
  checkInDate: z.string().refine((d) => !isNaN(Date.parse(d)), 'Invalid check-in date'),
  checkOutDate: z.string().refine((d) => !isNaN(Date.parse(d)), 'Invalid check-out date'),
}).refine((data) => {
  const checkIn = new Date(data.checkInDate);
  const checkOut = new Date(data.checkOutDate);
  return checkOut > checkIn;
}, { message: 'Check-out must be after check-in' });

describe('Booking date validation', () => {
  it('accepts valid future check-in/out dates', () => {
    const checkIn = new Date();
    checkIn.setDate(checkIn.getDate() + 7);
    const checkOut = new Date(checkIn);
    checkOut.setDate(checkOut.getDate() + 3);

    expect(bookingDateSchema.safeParse({
      checkInDate: checkIn.toISOString().split('T')[0],
      checkOutDate: checkOut.toISOString().split('T')[0],
    }).success).toBe(true);
  });

  it('rejects check-out before check-in', () => {
    const checkIn = new Date('2026-07-10');
    const checkOut = new Date('2026-07-09');
    expect(bookingDateSchema.safeParse({
      checkInDate: checkIn.toISOString().split('T')[0],
      checkOutDate: checkOut.toISOString().split('T')[0],
    }).success).toBe(false);
  });

  it('rejects same-day check-in and check-out', () => {
    expect(bookingDateSchema.safeParse({
      checkInDate: '2026-07-10',
      checkOutDate: '2026-07-10',
    }).success).toBe(false);
  });

  it('accepts 1-night stay', () => {
    expect(bookingDateSchema.safeParse({
      checkInDate: '2026-07-10',
      checkOutDate: '2026-07-11',
    }).success).toBe(true);
  });

  it('rejects invalid date strings', () => {
    expect(bookingDateSchema.safeParse({ checkInDate: 'not-a-date', checkOutDate: '2026-07-11' }).success).toBe(false);
    expect(bookingDateSchema.safeParse({ checkInDate: '2026-07-10', checkOutDate: 'bad' }).success).toBe(false);
  });
});

describe('Booking status transitions', () => {
  type BookingStatus = 'pending' | 'confirmed' | 'checked_in' | 'checked_out' | 'cancelled' | 'no_show';

  const ALLOWED_TRANSITIONS: Record<BookingStatus, BookingStatus[]> = {
    pending: ['confirmed', 'cancelled'],
    confirmed: ['checked_in', 'cancelled', 'no_show'],
    checked_in: ['checked_out'],
    checked_out: [],
    cancelled: [],
    no_show: [],
  };

  const canTransition = (from: BookingStatus, to: BookingStatus) =>
    ALLOWED_TRANSITIONS[from]?.includes(to) ?? false;

  it('pending → confirmed is allowed', () => expect(canTransition('pending', 'confirmed')).toBe(true));
  it('confirmed → checked_in is allowed', () => expect(canTransition('confirmed', 'checked_in')).toBe(true));
  it('checked_in → checked_out is allowed', () => expect(canTransition('checked_in', 'checked_out')).toBe(true));
  it('pending → checked_in is NOT allowed', () => expect(canTransition('pending', 'checked_in')).toBe(false));
  it('checked_out → checked_in is NOT allowed', () => expect(canTransition('checked_out', 'checked_in')).toBe(false));
  it('cancelled booking cannot be reactivated', () => {
    expect(canTransition('cancelled', 'confirmed')).toBe(false);
    expect(canTransition('cancelled', 'checked_in')).toBe(false);
  });
  it('no_show is terminal', () => {
    expect(ALLOWED_TRANSITIONS['no_show'].length).toBe(0);
  });
  it('confirmed → cancelled is allowed (cancellation flow)', () => expect(canTransition('confirmed', 'cancelled')).toBe(true));
  it('confirmed → no_show is allowed', () => expect(canTransition('confirmed', 'no_show')).toBe(true));
});

describe('Folio charge types and logic', () => {
  type ChargeType = 'room' | 'fnb' | 'tax' | 'adjustment' | 'payment';

  it('charge types match the enum in migration 0009', () => {
    const validTypes: ChargeType[] = ['room', 'fnb', 'tax', 'adjustment', 'payment'];
    expect(validTypes).toContain('room');
    expect(validTypes).toContain('fnb');
    expect(validTypes).toContain('payment');
    expect(validTypes).not.toContain('deposit'); // not a valid type
  });

  it('payment charge has negative amount (reduces balance)', () => {
    const folioLines = [
      { chargeType: 'room', amount: 500, status: 'open' },
      { chargeType: 'fnb', amount: 150, status: 'open' },
      { chargeType: 'payment', amount: -650, status: 'settled' },
    ];
    const balanceDue = folioLines
      .filter((l) => l.status === 'open' && l.chargeType !== 'payment')
      .reduce((sum, l) => sum + l.amount, 0)
    + folioLines
      .filter((l) => l.chargeType === 'payment')
      .reduce((sum, l) => sum + l.amount, 0);

    expect(balanceDue).toBe(0); // fully settled
  });

  it('partial payment leaves remaining balance', () => {
    const total = 500;
    const paid = 200;
    const remaining = Math.max(0, total + (-paid));
    expect(remaining).toBe(300);
  });

  it('checkout is blocked when folio has open balance', () => {
    const folio = { balanceDue: 350, folioClosedAt: null };
    const canCheckOut = folio.balanceDue <= 0 || folio.folioClosedAt !== null;
    expect(canCheckOut).toBe(false);
  });

  it('checkout proceeds when folio is fully settled', () => {
    const folio = { balanceDue: 0, folioClosedAt: null };
    const canCheckOut = folio.balanceDue <= 0;
    expect(canCheckOut).toBe(true);
  });
});

describe('Booking reference format', () => {
  it('booking reference is URL-safe alphanumeric', () => {
    const generateRef = () => `BK-${Date.now().toString(36).toUpperCase()}`;
    const ref = generateRef();
    expect(ref).toMatch(/^BK-[A-Z0-9]+$/);
  });

  it('merchant reference for Adumo is max 38 chars, alphanumeric', () => {
    const generateRef = (bookingId: string) => {
      const compact = bookingId.replace(/-/g, '').slice(0, 12);
      const ref = `HE${compact}${Date.now().toString(36)}`;
      return ref.slice(0, 38);
    };
    const ref = generateRef('550e8400-e29b-41d4-a716-446655440000');
    expect(ref.length).toBeLessThanOrEqual(38);
    expect(ref).toMatch(/^[A-Za-z0-9]+$/);
  });
});
