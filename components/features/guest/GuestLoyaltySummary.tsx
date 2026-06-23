/**
 * GuestLoyaltySummary — Loyalty redemption with modal
 *
 * Purpose: Display hub loyalty points, tier, progress bar, and redemption modal for active stays.
 * Location: /components/features/guest/GuestLoyaltySummary.tsx
 *
 * Features:
 * - Displays loyalty balance with tier badge
 * - Progress bar toward next tier (bronze→silver→gold→platinum)
 * - "Redeem points" button opens modal with point entry and active stay selection
 * - Modal validates points (≤ available balance) and applies to chosen booking
 * - Follows Part 9: daisyUI, pill buttons (rounded-full px-6), min-h-touch-mobile
 */

'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import type { GuestLoyaltyHubSummary } from '@/lib/types/folio';
import { guestCopy } from '@/lib/copy/guest';

interface GuestLoyaltySummaryProps {
  loyalty: GuestLoyaltyHubSummary | null;
  /** Active bookings eligible for redemption (optional) */
  activeStays?: Array<{ bookingId: string; bookingReference: string; propertyName: string; balanceDue: number; currency: string }>;
}

/** Tier thresholds (points required to reach next tier) */
const TIER_THRESHOLDS = {
  bronze: 0,
  silver: 1000,
  gold: 5000,
  platinum: 15000,
};

const TIER_NAMES: Record<string, string> = {
  bronze: 'Bronze',
  silver: 'Silver',
  gold: 'Gold',
  platinum: 'Platinum',
};

function getTierProgress(tier: string, points: number): { current: number; next: number; percent: number } {
  const tierLower = tier.toLowerCase();
  const currentThreshold = TIER_THRESHOLDS[tierLower as keyof typeof TIER_THRESHOLDS] ?? 0;
  let nextThreshold = 0;

  if (tierLower === 'bronze') {
    nextThreshold = TIER_THRESHOLDS.silver;
  } else if (tierLower === 'silver') {
    nextThreshold = TIER_THRESHOLDS.gold;
  } else if (tierLower === 'gold') {
    nextThreshold = TIER_THRESHOLDS.platinum;
  } else {
    return { current: currentThreshold, next: currentThreshold, percent: 100 };
  }

  const progressInTier = points - currentThreshold;
  const tierRange = nextThreshold - currentThreshold;
  const percent = Math.min(100, Math.floor((progressInTier / tierRange) * 100));

  return { current: currentThreshold, next: nextThreshold, percent };
}

export function GuestLoyaltySummary({ loyalty, activeStays = [] }: GuestLoyaltySummaryProps) {
  const [isRedeemModalOpen, setIsRedeemModalOpen] = useState(false);
  const [pointsToRedeem, setPointsToRedeem] = useState('');
  const [selectedBookingId, setSelectedBookingId] = useState('');
  const [isRedeeming, setIsRedeeming] = useState(false);
  const [redeemError, setRedeemError] = useState<string | null>(null);

  if (!loyalty || loyalty.loyaltyPoints <= 0) {
    return (
      <Card variant="elevated" className="p-6">
        <h2 className="font-display text-lg font-bold text-ink-900 mb-2">
          {guestCopy.loyalty.title}
        </h2>
        <p className="text-sm text-ink-600">{guestCopy.loyalty.empty}</p>
        <p className="text-xs text-ink-500 mt-2">{guestCopy.hub.loyaltyHint}</p>
      </Card>
    );
  }

  const tierLower = loyalty.loyaltyTier.toLowerCase();
  const tierName = TIER_NAMES[tierLower] || loyalty.loyaltyTier;
  const progress = getTierProgress(tierLower, loyalty.loyaltyPoints);
  const canRedeem = activeStays.length > 0 && loyalty.loyaltyPoints > 0;

  async function handleRedeemSubmit(e: React.FormEvent) {
    e.preventDefault();
    setRedeemError(null);

    if (!loyalty) {
      setRedeemError('Loyalty information not available');
      return;
    }

    const points = parseInt(pointsToRedeem, 10);
    if (!points || points <= 0 || points > loyalty.loyaltyPoints) {
      setRedeemError(`Enter a valid amount (1 - ${loyalty.loyaltyPoints.toLocaleString()} points)`);
      return;
    }
    if (!selectedBookingId) {
      setRedeemError('Select a stay to apply points to');
      return;
    }

    setIsRedeeming(true);
    try {
      const res = await fetch('/api/loyalty/redeem', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ bookingId: selectedBookingId, points }),
      });
      const json = await res.json();
      if (!res.ok) {
        throw new Error(json?.error?.message || 'Redemption failed');
      }
      alert(`✅ ${points} points redeemed successfully!`);
      setIsRedeemModalOpen(false);
      window.location.reload();
    } catch (err) {
      setRedeemError(err instanceof Error ? err.message : 'Redemption failed. Try again.');
    } finally {
      setIsRedeeming(false);
    }
  }

  return (
    <>
      <Card variant="elevated" className="p-6 space-y-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <h2 className="font-display text-lg font-bold text-ink-900 mb-1">
              {guestCopy.loyalty.title}
            </h2>
            <p className="text-3xl font-bold text-ci-secondary-chocolate tabular-nums">
              {loyalty.loyaltyPoints.toLocaleString()}{' '}
              <span className="text-base font-medium text-ink-600">points</span>
            </p>
          </div>
          <span
            className="badge badge-lg badge-primary capitalize font-semibold"
            aria-label={`Current tier: ${tierName}`}
          >
            {tierName}
          </span>
        </div>

        {progress.percent < 100 && (
          <div>
            <p className="text-xs text-ink-600 mb-2">
              {progress.next - loyalty.loyaltyPoints} points to {TIER_NAMES[Object.keys(TIER_THRESHOLDS).find(k => TIER_THRESHOLDS[k as keyof typeof TIER_THRESHOLDS] === progress.next) || '']}
            </p>
            <progress
              className="progress progress-primary w-full"
              value={progress.percent}
              max={100}
              aria-label={`Tier progress: ${progress.percent}%`}
            />
          </div>
        )}

        {canRedeem && (
          <Button
            onClick={() => setIsRedeemModalOpen(true)}
            className="w-full sm:w-auto"
            aria-haspopup="dialog"
          >
            Redeem points
          </Button>
        )}

        {!canRedeem && activeStays.length === 0 && (
          <p className="text-xs text-ink-500">{guestCopy.hub.loyaltyHint}</p>
        )}
      </Card>

      {/* Redemption Modal (native dialog) */}
      {isRedeemModalOpen && (
        <dialog open className="modal modal-open" aria-labelledby="redeem-modal-title">
          <div className="modal-box max-w-md">
            <h3 id="redeem-modal-title" className="font-bold text-lg text-ink-900 mb-4">
              Redeem loyalty points
            </h3>
            <form onSubmit={handleRedeemSubmit} className="space-y-4">
              <div>
                <label htmlFor="points-input" className="label">
                  <span className="label-text font-medium">Points to redeem</span>
                </label>
                <input
                  id="points-input"
                  type="number"
                  min={1}
                  max={loyalty.loyaltyPoints}
                  value={pointsToRedeem}
                  onChange={(e) => setPointsToRedeem(e.target.value)}
                  placeholder={`Available: ${loyalty.loyaltyPoints.toLocaleString()}`}
                  className="input input-bordered w-full"
                  required
                  aria-describedby="points-hint"
                />
                <p id="points-hint" className="text-xs text-ink-600 mt-1">
                  1 point = N$1 off your folio balance
                </p>
              </div>

              <div>
                <label htmlFor="booking-select" className="label">
                  <span className="label-text font-medium">Apply to stay</span>
                </label>
                <select
                  id="booking-select"
                  value={selectedBookingId}
                  onChange={(e) => setSelectedBookingId(e.target.value)}
                  className="select select-bordered w-full"
                  required
                >
                  <option value="">Select a booking</option>
                  {activeStays.map((stay) => (
                    <option key={stay.bookingId} value={stay.bookingId}>
                      {stay.propertyName} (Ref {stay.bookingReference}) — {stay.currency} {stay.balanceDue.toFixed(2)} due
                    </option>
                  ))}
                </select>
              </div>

              {redeemError && (
                <div className="alert alert-error" role="alert">
                  <span className="text-sm">{redeemError}</span>
                </div>
              )}

              <div className="modal-action">
                <button
                  type="button"
                  onClick={() => setIsRedeemModalOpen(false)}
                  className="btn btn-ghost rounded-full px-6"
                  disabled={isRedeeming}
                >
                  Cancel
                </button>
                <Button type="submit" isLoading={isRedeeming}>
                  Apply points
                </Button>
              </div>
            </form>
          </div>
          <form method="dialog" className="modal-backdrop">
            <button type="button" onClick={() => setIsRedeemModalOpen(false)} aria-label="Close modal">
              close
            </button>
          </form>
        </dialog>
      )}
    </>
  );
}
