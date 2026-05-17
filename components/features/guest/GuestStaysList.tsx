/**
 * GuestStaysList
 *
 * Purpose: Client list of active stays and bookings awaiting deposit payment.
 * Location: /components/features/guest/GuestStaysList.tsx
 */

'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { BookingDepositPayCard } from '@/components/payments/BookingDepositPayCard';
import { GuestLoyaltySummary } from '@/components/features/guest/GuestLoyaltySummary';
import { guestCopy } from '@/lib/copy/guest';
import type {
  GuestLoyaltyHubSummary,
  GuestPastStaySummary,
  GuestPaymentDueSummary,
  GuestStaySummary,
} from '@/lib/types/folio';

type HubData = {
  activeStays: GuestStaySummary[];
  paymentDue: GuestPaymentDueSummary[];
  pastStays: GuestPastStaySummary[];
  loyalty: GuestLoyaltyHubSummary | null;
};

function normalizeHubPayload(json: { data?: unknown }): HubData {
  const data = json.data;
  if (Array.isArray(data)) {
    return {
      activeStays: data as GuestStaySummary[],
      paymentDue: [],
      pastStays: [],
      loyalty: null,
    };
  }
  if (data && typeof data === 'object') {
    const hub = data as HubData;
    return {
      activeStays: hub.activeStays ?? [],
      paymentDue: hub.paymentDue ?? [],
      pastStays: hub.pastStays ?? [],
      loyalty: hub.loyalty ?? null,
    };
  }
  return { activeStays: [], paymentDue: [], pastStays: [], loyalty: null };
}

export function GuestStaysList() {
  const [activeStays, setActiveStays] = useState<GuestStaySummary[]>([]);
  const [paymentDue, setPaymentDue] = useState<GuestPaymentDueSummary[]>([]);
  const [pastStays, setPastStays] = useState<GuestPastStaySummary[]>([]);
  const [loyalty, setLoyalty] = useState<GuestLoyaltyHubSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
          const hub = normalizeHubPayload(json);
          setActiveStays(hub.activeStays);
          setPaymentDue(hub.paymentDue);
          setPastStays(hub.pastStays);
          setLoyalty(hub.loyalty);
        }
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : 'Failed to load stays');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

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

  return (
    <div className="space-y-8">
      <GuestLoyaltySummary loyalty={loyalty} />

      {paymentDue.length > 0 && (
        <section>
          <h2 className="font-display text-xl font-bold text-terracotta-900 mb-4">
            Payment due
          </h2>
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
                  <Link href={`/guest/stays/${booking.bookingId}`} className="text-sm text-terracotta-700 hover:underline">
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
          <h2 className="font-display text-xl font-bold text-terracotta-900 mb-4">
            Active stays
          </h2>
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
          <ul className="space-y-4">
            {pastStays.map((stay) => (
              <li key={stay.bookingId}>
                <Card variant="elevated" className="p-6">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                      <h3 className="font-display text-lg font-bold text-nude-900">
                        {stay.propertyName}
                      </h3>
                      <p className="text-sm text-nude-600">
                        Ref {stay.bookingReference} · 
                        <span className="capitalize">{stay.status.replace('_', ' ')}</span>
                        {stay.roomNumbers.length > 0 && ` · Room ${stay.roomNumbers.join(', ')}`}
                      </p>
                      <p className="text-sm text-nude-600 mt-1">
                        {stay.checkInDate} → {stay.checkOutDate}
                      </p>
                    </div>
                    <Link href={`/guest/stays/${stay.bookingId}`}>
                      <Button variant="outline">View folio history</Button>
                    </Link>
                  </div>
                </Card>
              </li>
            ))}
          </ul>
        </section>
      )}

    </div>
  );
}
