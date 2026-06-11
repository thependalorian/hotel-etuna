import { describe, it, expect } from 'vitest';
import { computeGuestInsights, nightsBetween } from '@/lib/guest/insights';
import type {
  GuestPastStaySummary,
  GuestStaySummary,
} from '@/lib/types/folio';

const active: GuestStaySummary = {
  bookingId: 'a1',
  bookingReference: 'REF-A1',
  status: 'checked_in',
  checkInDate: '2026-06-01',
  checkOutDate: '2026-06-04', // 3 nights
  propertyId: 'p1',
  propertyName: 'Hotel Etuna',
  propertySlug: 'hotel-etuna',
  roomNumbers: ['12'],
  balanceDue: 500,
  currency: 'NAD',
};

const past1: GuestPastStaySummary = {
  bookingId: 'b1',
  bookingReference: 'REF-B1',
  status: 'checked_out',
  checkInDate: '2026-01-10',
  checkOutDate: '2026-01-12', // 2 nights
  propertyId: 'p1',
  propertyName: 'Hotel Etuna',
  propertySlug: 'hotel-etuna',
  roomNumbers: ['7'],
  currency: 'NAD',
  totalAmount: 1600,
};

const past2: GuestPastStaySummary = {
  ...past1,
  bookingId: 'b2',
  bookingReference: 'REF-B2',
  checkInDate: '2026-02-01',
  checkOutDate: '2026-02-02', // 1 night
  totalAmount: 800,
};

describe('nightsBetween', () => {
  it('counts whole nights', () => {
    expect(nightsBetween('2026-06-01', '2026-06-04')).toBe(3);
  });
  it('returns 0 for invalid or non-positive ranges', () => {
    expect(nightsBetween('2026-06-04', '2026-06-01')).toBe(0);
    expect(nightsBetween('not-a-date', '2026-06-01')).toBe(0);
  });
});

describe('computeGuestInsights', () => {
  it('aggregates nights, spend, loyalty and top property', () => {
    const result = computeGuestInsights({
      activeStays: [active],
      pastStays: [past1, past2],
      loyalty: { loyaltyPoints: 240, loyaltyTier: 'silver', profileCount: 1 },
    });
    expect(result.totalStays).toBe(3);
    expect(result.totalNights).toBe(6); // 3 + 2 + 1
    expect(result.lifetimeSpend).toBe(2400); // 1600 + 800 (past only)
    expect(result.currency).toBe('NAD');
    expect(result.loyaltyPoints).toBe(240);
    expect(result.loyaltyTier).toBe('silver');
    expect(result.topProperty).toBe('Hotel Etuna');
  });

  it('handles an empty hub', () => {
    const result = computeGuestInsights({ activeStays: [], pastStays: [], loyalty: null });
    expect(result).toMatchObject({
      totalStays: 0,
      totalNights: 0,
      lifetimeSpend: 0,
      currency: 'NAD',
      loyaltyPoints: 0,
      loyaltyTier: null,
      topProperty: null,
    });
  });
});
