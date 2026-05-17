/**
 * GuestLoyaltySummary
 *
 * Purpose: Hub loyalty points and tier for the signed-in guest email.
 * Location: /components/features/guest/GuestLoyaltySummary.tsx
 */

'use client';

import { Card } from '@/components/ui/Card';
import type { GuestLoyaltyHubSummary } from '@/lib/types/folio';
import { guestCopy } from '@/lib/copy/guest';

interface GuestLoyaltySummaryProps {
  loyalty: GuestLoyaltyHubSummary | null;
}

export function GuestLoyaltySummary({ loyalty }: GuestLoyaltySummaryProps) {
  if (!loyalty || loyalty.loyaltyPoints <= 0) {
    return (
      <Card variant="elevated" className="p-6">
        <h2 className="font-display text-lg font-bold text-nude-900 mb-2">
          {guestCopy.loyalty.title}
        </h2>
        <p className="text-sm text-nude-600">{guestCopy.loyalty.empty}</p>
        <p className="text-xs text-nude-500 mt-2">{guestCopy.hub.loyaltyHint}</p>
      </Card>
    );
  }

  return (
    <Card variant="elevated" className="p-6">
      <h2 className="font-display text-lg font-bold text-nude-900 mb-2">
        {guestCopy.loyalty.title}
      </h2>
      <p className="text-3xl font-bold text-terracotta-900 tabular-nums">
        {loyalty.loyaltyPoints.toLocaleString()}{' '}
        <span className="text-base font-medium text-nude-600">points</span>
      </p>
      <p className="text-sm text-nude-600 mt-1 capitalize">
        Tier: {loyalty.loyaltyTier}
      </p>
      <p className="text-xs text-nude-500 mt-3">{guestCopy.hub.loyaltyHint}</p>
    </Card>
  );
}
