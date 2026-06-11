/**
 * Guest insights — derive stay statistics from the guest hub payload.
 *
 * Location: lib/guest/insights.ts
 *
 * Reason: the dashboard shows "total nights / lifetime spend / loyalty" stats. All of it is
 * already in `GET /api/guest/stays`, so we compute client-side (pure, testable) rather than
 * adding an endpoint.
 */

import type {
  GuestLoyaltyHubSummary,
  GuestPastStaySummary,
  GuestStaySummary,
} from '@/lib/types/folio';

export interface GuestInsights {
  totalStays: number;
  totalNights: number;
  lifetimeSpend: number;
  currency: string;
  loyaltyPoints: number;
  loyaltyTier: string | null;
  topProperty: string | null;
}

interface GuestInsightsInput {
  activeStays: GuestStaySummary[];
  pastStays: GuestPastStaySummary[];
  loyalty: GuestLoyaltyHubSummary | null;
}

/** Whole nights between two `YYYY-MM-DD` (or ISO) dates; 0 if invalid or non-positive. */
export function nightsBetween(checkIn: string, checkOut: string): number {
  const start = Date.parse(checkIn);
  const end = Date.parse(checkOut);
  if (!Number.isFinite(start) || !Number.isFinite(end)) return 0;
  const nights = Math.round((end - start) / (1000 * 60 * 60 * 24));
  return nights > 0 ? nights : 0;
}

/**
 * Compute headline guest insights from the hub payload.
 *
 * @param input - Active + past stays and loyalty summary from `/api/guest/stays`.
 * @returns Aggregated stats for the dashboard stat cards.
 */
export function computeGuestInsights({
  activeStays,
  pastStays,
  loyalty,
}: GuestInsightsInput): GuestInsights {
  const allStays = [...activeStays, ...pastStays];

  const totalNights = allStays.reduce(
    (sum, stay) => sum + nightsBetween(stay.checkInDate, stay.checkOutDate),
    0,
  );

  const lifetimeSpend = pastStays.reduce(
    (sum, stay) => sum + (Number.isFinite(stay.totalAmount) ? stay.totalAmount : 0),
    0,
  );

  const currency = allStays.find((s) => s.currency)?.currency ?? 'NAD';

  // Most-visited property by stay count.
  const counts = new Map<string, number>();
  for (const stay of allStays) {
    if (stay.propertyName) {
      counts.set(stay.propertyName, (counts.get(stay.propertyName) ?? 0) + 1);
    }
  }
  let topProperty: string | null = null;
  let topCount = 0;
  for (const [name, count] of counts) {
    if (count > topCount) {
      topProperty = name;
      topCount = count;
    }
  }

  return {
    totalStays: allStays.length,
    totalNights,
    lifetimeSpend,
    currency,
    loyaltyPoints: loyalty?.loyaltyPoints ?? 0,
    loyaltyTier: loyalty?.loyaltyTier ? String(loyalty.loyaltyTier) : null,
    topProperty,
  };
}
