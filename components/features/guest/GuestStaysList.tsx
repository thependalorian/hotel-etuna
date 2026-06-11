/**
 * GuestStaysList / GuestStaysSections
 *
 * Purpose: Render a guest's active stays, deposit-due bookings, and past stays.
 * Location: /components/features/guest/GuestStaysList.tsx
 *
 * `GuestStaysSections` is presentational (takes hub data); `GuestStaysList` is the
 * self-fetching wrapper. The guest dashboard fetches once via `useGuestHub` and renders
 * `GuestStaysSections` directly (no duplicate request).
 */

'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { BookingDepositPayCard } from '@/components/payments/BookingDepositPayCard';
import { GuestLoyaltySummary } from '@/components/features/guest/GuestLoyaltySummary';
import { guestCopy } from '@/lib/copy/guest';
import { useGuestHub, type GuestHubState } from '@/components/features/guest/useGuestHub';
import { LoyaltyRedeemModal } from '@/components/features/guest/LoyaltyRedeemModal';
import { PastStayCard } from '@/components/features/guest/PastStayCard';

/** Presentational stays sections — data supplied by the caller. */
export function GuestStaysSections({
  activeStays,
  paymentDue,
  pastStays,
  loyalty,
  loading,
  error,
}: GuestHubState) {
  const [redeemModalOpen, setRedeemModalOpen] = useState(false);

  if (loading) {
    return <div className="skeleton h-40 w-full rounded-xl" aria-hidden />;
  }

  if (error) {
    return (
      <Card variant="elevated" className="p-8 text-center">
        <p className="text-semantic-error-dark mb-4">{error}</p>
        <Link href="/login?redirect=/guest">
          <Button>Sign in</Button>
        </Link>
      </Card>
    );
  }

  const empty =
    activeStays.length === 0 && paymentDue.length === 0 && pastStays.length === 0;

  if (empty) {
    return (
      <Card variant="elevated" className="p-8 text-center">
        <h2 className="font-display text-xl font-bold text-nude-900 mb-2">No active stays</h2>
        <p className="text-nude-600 mb-4">
          We could not find a current reservation for your account. Stays appear here from check-in
          through check-out; unpaid confirmed bookings appear under payment due.
        </p>
        <Link href="/rooms">
          <Button variant="outline">Browse rooms</Button>
        </Link>
      </Card>
    );
  }

  const redemptionEligibleStays = activeStays.map((stay) => ({
    bookingId: stay.bookingId,
    bookingReference: stay.bookingReference,
    propertyName: stay.propertyName,
    balanceDue: stay.balanceDue,
    currency: stay.currency,
  }));

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <GuestLoyaltySummary loyalty={loyalty} activeStays={redemptionEligibleStays} />
        {loyalty && loyalty.loyaltyPoints > 0 && redemptionEligibleStays.length > 0 && (
          <Button onClick={() => setRedeemModalOpen(true)}>Redeem points</Button>
        )}
      </div>

      {paymentDue.length > 0 && (
        <section>
          <h2 className="font-display text-xl font-bold text-terracotta-900 mb-4">Payment due</h2>
          <ul className="space-y-4">
            {paymentDue.map((booking) => (
              <li key={booking.bookingId}>
                <Card variant="elevated" className="p-6 space-y-4">
                  <div>
                    <h3 className="font-display text-lg font-bold text-nude-900">
                      {booking.propertyName}
                    </h3>
                    <p className="text-sm text-nude-600">
                      Ref {booking.bookingReference} · {booking.checkInDate} →{' '}
                      {booking.checkOutDate}
                    </p>
                  </div>
                  <BookingDepositPayCard
                    bookingId={booking.bookingId}
                    bookingReference={booking.bookingReference}
                    amount={booking.totalAmount}
                    currency={booking.currency}
                  />
                  <Link
                    href={`/guest/stays/${booking.bookingId}`}
                    className="text-sm text-terracotta-700 hover:underline"
                  >
                    View booking details
                  </Link>
                </Card>
              </li>
            ))}
          </ul>
        </section>
      )}

      {activeStays.length > 0 && (
        <section>
          <h2 className="font-display text-xl font-bold text-terracotta-900 mb-4">Active stays</h2>
          <ul className="space-y-4">
            {activeStays.map((stay) => (
              <li key={stay.bookingId}>
                <Card variant="interactive" className="p-6">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                      <h3 className="font-display text-lg font-bold text-nude-900">
                        {stay.propertyName}
                      </h3>
                      <p className="text-sm text-nude-600">
                        Ref {stay.bookingReference} ·{' '}
                        <span className="capitalize">{stay.status.replace('_', ' ')}</span>
                        {stay.roomNumbers.length > 0 && ` · Room ${stay.roomNumbers.join(', ')}`}
                      </p>
                      <p className="text-sm text-nude-600 mt-1">
                        {stay.checkInDate} → {stay.checkOutDate}
                      </p>
                      <p className="text-sm font-semibold text-nude-900 mt-2">
                        Folio balance: {stay.currency} {stay.balanceDue.toFixed(2)}
                      </p>
                    </div>
                    <Link href={`/guest/stays/${stay.bookingId}`}>
                      <Button>Open folio &amp; room service</Button>
                    </Link>
                  </div>
                </Card>
              </li>
            ))}
          </ul>
        </section>
      )}

      {pastStays.length > 0 && (
        <section>
          <h2 className="font-display text-xl font-bold text-terracotta-900 mb-4">
            {guestCopy.hub.pastStaysTitle}
          </h2>
          <p className="text-sm text-nude-600 mb-4">
            Expand each stay to view your past folio and download receipts.
          </p>
          <div className="space-y-2">
            {pastStays.map((stay) => (
              <PastStayCard key={stay.bookingId} stay={stay} />
            ))}
          </div>
        </section>
      )}

      <LoyaltyRedeemModal
        isOpen={redeemModalOpen}
        onClose={() => setRedeemModalOpen(false)}
        activeStayId={redemptionEligibleStays.length > 0 ? redemptionEligibleStays[0].bookingId : null}
        loyaltyPointsBalance={loyalty?.loyaltyPoints || 0}
      />
    </div>
  );
}

/** Self-fetching wrapper (backward compatible). */
export function GuestStaysList() {
  const hub = useGuestHub();
  return <GuestStaysSections {...hub} />;
}
