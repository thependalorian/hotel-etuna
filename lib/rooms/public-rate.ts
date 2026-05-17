/**
 * Public rate display helpers — never expose numeric rates to guests in UI or APIs.
 * Location: lib/rooms/public-rate.ts
 */

import { publicCopy } from '@/lib/copy/public';

type RateSource = {
  priceFrom?: string | number | null;
  baseRate?: string | number | null;
  currency?: string | null;
};

export function formatPublicRoomRateLabel(
  room: RateSource,
  isAuthenticated: boolean,
): string {
  if (!isAuthenticated) {
    return publicCopy.gated.viewRates;
  }

  const raw = room.priceFrom ?? room.baseRate;
  if (raw === null || raw === undefined || raw === '') {
    return 'Price on request';
  }

  const amount = Number(raw);
  if (Number.isNaN(amount)) {
    return 'Price on request';
  }

  const currency = room.currency ?? 'NAD';
  return `${currency} ${amount.toLocaleString()}`;
}

export function stripRatesFromAvailabilityRow<T extends { baseRate?: unknown }>(
  row: T,
): Omit<T, 'baseRate'> {
  const { baseRate: _removed, ...rest } = row;
  return rest;
}
