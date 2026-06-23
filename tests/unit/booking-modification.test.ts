/**
 * Unit tests for BookingModificationService pure helpers (money/date logic).
 * Location: tests/unit/booking-modification.test.ts
 */
import { describe, it, expect } from 'vitest';
import { nightsBetween, quoteStay } from '@/lib/services/booking/BookingModificationService';

describe('nightsBetween', () => {
  it('counts whole nights for a normal stay', () => {
    expect(nightsBetween('2026-06-23', '2026-06-26')).toBe(3);
  });

  it('is DST/timezone-safe across a month boundary', () => {
    expect(nightsBetween('2026-06-29', '2026-07-02')).toBe(3);
  });

  it('returns 0 for same-day and negatives for reversed ranges', () => {
    expect(nightsBetween('2026-06-23', '2026-06-23')).toBe(0);
    expect(nightsBetween('2026-06-26', '2026-06-23')).toBe(-3);
  });

  it('returns 0 for invalid input', () => {
    expect(nightsBetween('not-a-date', '2026-06-26')).toBe(0);
  });
});

describe('quoteStay', () => {
  it('multiplies rate by nights, rounded to cents', () => {
    expect(quoteStay(850, 3)).toEqual({ ratePerNight: 850, nights: 3, total: 2550 });
  });

  it('rounds fractional cents correctly', () => {
    expect(quoteStay(99.999, 2).total).toBe(200);
  });

  it('never produces negative nights or NaN totals', () => {
    expect(quoteStay(850, -2)).toEqual({ ratePerNight: 850, nights: 0, total: 0 });
    expect(quoteStay(Number.NaN, 3).total).toBe(0);
  });
});
