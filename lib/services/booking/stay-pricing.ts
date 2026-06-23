/**
 * @fileoverview Accommodation stay pricing — shared pure helpers.
 * Location: lib/services/booking/stay-pricing.ts
 *
 * Single source for "nights × nightly rate" so booking creation (BookingService) and
 * booking modification (BookingModificationService) price stays identically. The nightly
 * rate is the room's `base_rate`, seeded from HOTEL_ETUNA_ROOM_RATES_NAD which matches the
 * published knowledge-base room rates.
 */

export type StayQuote = {
  ratePerNight: number;
  nights: number;
  total: number;
};

/** Whole nights between two YYYY-MM-DD date strings (UTC, DST-safe). */
export function nightsBetween(checkIn: string, checkOut: string): number {
  const a = Date.parse(`${checkIn}T00:00:00Z`);
  const b = Date.parse(`${checkOut}T00:00:00Z`);
  if (Number.isNaN(a) || Number.isNaN(b)) return 0;
  return Math.round((b - a) / 86_400_000);
}

/** Re-quote a stay: nights × nightly rate, rounded to cents. Negative nights clamp to 0. */
export function quoteStay(ratePerNight: number, nights: number): StayQuote {
  const rate = Number.isFinite(ratePerNight) ? ratePerNight : 0;
  const safeNights = Math.max(0, nights);
  return {
    ratePerNight: rate,
    nights: safeNights,
    total: Math.round(rate * safeNights * 100) / 100,
  };
}
