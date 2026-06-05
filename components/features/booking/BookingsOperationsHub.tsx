/**
 * BookingsOperationsHub — calendar + kind filters for property bookings.
 * Location: components/features/booking/BookingsOperationsHub.tsx
 */

'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import BookingCalendar from '@/components/features/booking/BookingCalendar';
import { cn } from '@/lib/utils/cn';
import type { BookingKind } from '@/lib/bookings/booking-kind';

type BookingsOperationsHubProps = {
  propertyId: string;
};

const FILTERS: { id: '' | BookingKind; label: string }[] = [
  { id: '', label: 'All' },
  { id: 'accommodation', label: 'Stays' },
  { id: 'conference', label: 'Conference' },
  { id: 'campsite', label: 'Campsite' },
];

export function BookingsOperationsHub({ propertyId }: BookingsOperationsHubProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const active = (searchParams.get('bookingKind') ?? '') as '' | BookingKind;

  function setFilter(kind: '' | BookingKind) {
    const params = new URLSearchParams(searchParams.toString());
    if (kind) {
      params.set('bookingKind', kind);
    } else {
      params.delete('bookingKind');
    }
    if (propertyId) {
      params.set('propertyId', propertyId);
    }
    router.push(`/bookings?${params.toString()}`);
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2" role="tablist" aria-label="Booking type filter">
        {FILTERS.map((f) => (
          <button
            key={f.id || 'all'}
            type="button"
            role="tab"
            aria-selected={active === f.id}
            className={cn(
              'btn btn-sm rounded-full px-4 min-h-[44px]',
              active === f.id ? 'btn-primary' : 'btn-outline'
            )}
            onClick={() => setFilter(f.id)}
          >
            {f.label}
          </button>
        ))}
      </div>
      <BookingCalendar propertyId={propertyId} />
    </div>
  );
}
