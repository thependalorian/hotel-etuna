/**
 * @fileoverview Rate recommendation math — pure, deterministic occupancy-band pricing.
 * Location: lib/services/intelligence/rate-pricing.ts
 *
 * Maps a forecast occupancy to a suggested nightly rate. This produces a SUGGESTION only;
 * it is never applied without admin/front-desk approval (see RateRecommendationService).
 * Kept pure so the bands are unit-testable and reviewable.
 */

export type DemandBand = 'peak' | 'high' | 'steady' | 'soft' | 'low';

export type RateSuggestion = {
  band: DemandBand;
  adjustmentPct: number; // signed, e.g. +0.15
  recommendedRate: number; // rounded to nearest N$10, clamped to ±25% of base
};

/** Occupancy bands → price adjustment. Higher forward demand → higher suggested rate. */
export function demandBand(forecastOccupancy: number): { band: DemandBand; adjustmentPct: number } {
  const occ = Number.isFinite(forecastOccupancy) ? forecastOccupancy : 0;
  if (occ >= 0.85) return { band: 'peak', adjustmentPct: 0.15 };
  if (occ >= 0.7) return { band: 'high', adjustmentPct: 0.08 };
  if (occ >= 0.5) return { band: 'steady', adjustmentPct: 0 };
  if (occ >= 0.3) return { band: 'soft', adjustmentPct: -0.05 };
  return { band: 'low', adjustmentPct: -0.1 };
}

/** Round to the nearest N$10 — hotel rates are quoted in round numbers. */
function roundRate(value: number): number {
  return Math.round(value / 10) * 10;
}

/**
 * Suggest a nightly rate from the current base rate and forecast occupancy.
 * @param baseRate - Current `rooms.base_rate` for the room type (NAD).
 * @param forecastOccupancy - Forward occupancy 0..1.
 * @returns Band, signed adjustment, and the rounded+clamped recommended rate.
 */
export function recommendRate(baseRate: number, forecastOccupancy: number): RateSuggestion {
  const base = Number.isFinite(baseRate) && baseRate > 0 ? baseRate : 0;
  const { band, adjustmentPct } = demandBand(forecastOccupancy);
  const raw = base * (1 + adjustmentPct);
  // Never let a single suggestion swing more than ±25% from base.
  const floor = base * 0.75;
  const ceil = base * 1.25;
  const clamped = Math.min(ceil, Math.max(floor, raw));
  return { band, adjustmentPct, recommendedRate: roundRate(clamped) };
}
