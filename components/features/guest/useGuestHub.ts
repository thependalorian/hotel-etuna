/**
 * useGuestHub — shared client hook for the guest stays hub payload.
 *
 * Location: components/features/guest/useGuestHub.ts
 *
 * Reason: `GET /api/guest/stays` returns the whole hub (active/paymentDue/past stays +
 * loyalty). The dashboard, the stays list, and insights all need it — fetch it **once**
 * and share, instead of each component hitting the network (DRY).
 */

'use client';

import { useEffect, useState } from 'react';
import type {
  GuestLoyaltyHubSummary,
  GuestPastStaySummary,
  GuestPaymentDueSummary,
  GuestStaySummary,
} from '@/lib/types/folio';

export interface GuestHubData {
  activeStays: GuestStaySummary[];
  paymentDue: GuestPaymentDueSummary[];
  pastStays: GuestPastStaySummary[];
  loyalty: GuestLoyaltyHubSummary | null;
}

export interface GuestHubState extends GuestHubData {
  loading: boolean;
  error: string | null;
}

/** Normalise the `/api/guest/stays` response (array legacy shape or hub object). */
export function normalizeHubPayload(json: { data?: unknown }): GuestHubData {
  const data = json.data;
  if (Array.isArray(data)) {
    return { activeStays: data as GuestStaySummary[], paymentDue: [], pastStays: [], loyalty: null };
  }
  if (data && typeof data === 'object') {
    const hub = data as GuestHubData;
    return {
      activeStays: hub.activeStays ?? [],
      paymentDue: hub.paymentDue ?? [],
      pastStays: hub.pastStays ?? [],
      loyalty: hub.loyalty ?? null,
    };
  }
  return { activeStays: [], paymentDue: [], pastStays: [], loyalty: null };
}

/**
 * Fetch the signed-in guest's hub (active/paymentDue/past stays + loyalty) once.
 *
 * @returns Hub data plus `loading` / `error` flags.
 */
export function useGuestHub(): GuestHubState {
  const [state, setState] = useState<GuestHubState>({
    activeStays: [],
    paymentDue: [],
    pastStays: [],
    loyalty: null,
    loading: true,
    error: null,
  });

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch('/api/guest/stays', { credentials: 'include' });
        const json = await res.json();
        if (!res.ok) {
          throw new Error(json?.error?.message || 'Failed to load stays');
        }
        if (!cancelled) {
          setState({ ...normalizeHubPayload(json), loading: false, error: null });
        }
      } catch (e) {
        if (!cancelled) {
          setState((prev) => ({
            ...prev,
            loading: false,
            error: e instanceof Error ? e.message : 'Failed to load stays',
          }));
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return state;
}
