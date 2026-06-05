/**
 * NewBookingTabs — staff create stay, conference, or campsite booking.
 * Location: components/features/booking/NewBookingTabs.tsx
 */

'use client';

import { useSearchParams, useRouter } from 'next/navigation';
import { Suspense } from 'react';
import { BookingForm } from '@/components/features/booking/BookingForm';
import { ConferenceBookingForm } from '@/components/features/booking/ConferenceBookingForm';
import { CampsiteBookingForm } from '@/components/features/booking/CampsiteBookingForm';
import LoadingSpinner from '@/components/shared/LoadingSpinner';
import { cn } from '@/lib/utils/cn';

type NewBookingTabsProps = {
  conferenceRoomId?: string;
  campsiteRoomId?: string;
};

function NewBookingTabsInner({
  conferenceRoomId,
  campsiteRoomId,
}: NewBookingTabsProps) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const tab = searchParams.get('tab') ?? 'stay';

  function setTab(next: string) {
    router.push(`/bookings/new?tab=${next}`);
  }

  return (
    <div className="space-y-6">
      <div className="tabs tabs-boxed bg-base-200 p-1 rounded-full max-w-xl" role="tablist">
        {[
          { id: 'stay', label: 'Room stay' },
          { id: 'conference', label: 'Conference' },
          { id: 'campsite', label: 'Campsite' },
        ].map((t) => (
          <button
            key={t.id}
            type="button"
            role="tab"
            aria-selected={tab === t.id}
            className={cn(
              'tab rounded-full flex-1 min-h-[44px]',
              tab === t.id && 'tab-active'
            )}
            onClick={() => setTab(t.id)}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'stay' && <BookingForm />}
      {tab === 'conference' &&
        (conferenceRoomId ? (
          <ConferenceBookingForm roomId={conferenceRoomId} redirectTo="/bookings" />
        ) : (
          <p className="alert alert-warning">Conference facility not seeded. Run seed or migrations.</p>
        ))}
      {tab === 'campsite' &&
        (campsiteRoomId ? (
          <CampsiteBookingForm roomId={campsiteRoomId} redirectTo="/bookings" />
        ) : (
          <p className="alert alert-warning">Campsite facility not seeded. Run seed or migrations.</p>
        ))}
    </div>
  );
}

export function NewBookingTabs(props: NewBookingTabsProps) {
  return (
    <Suspense fallback={<LoadingSpinner size="lg" text="Loading forms…" />}>
      <NewBookingTabsInner {...props} />
    </Suspense>
  );
}
