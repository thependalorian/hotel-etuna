'use client';

/**
 * Whole-site campsite booking with Namibian / non-Namibian per-person rates.
 * Location: components/features/booking/CampsiteBookingForm.tsx
 */

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import {
  HOTEL_ETUNA_FACILITY_RATES,
} from '@/lib/constants/hotel-etuna-room-types';
import { calculateCampsiteTotal } from '@/lib/services/booking/FacilityBookingPricing';
import { submitFacilityBooking } from '@/components/features/booking/facility-booking-submit';

type CampsiteBookingFormProps = {
  roomId: string;
  redirectTo?: string;
};

export function CampsiteBookingForm({ roomId, redirectTo }: CampsiteBookingFormProps) {
  const router = useRouter();
  const [checkInDate, setCheckInDate] = useState('');
  const [checkOutDate, setCheckOutDate] = useState('');
  const [namibianGuests, setNamibianGuests] = useState(0);
  const [nonNamibianGuests, setNonNamibianGuests] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const previewTotal = useMemo(
    () =>
      calculateCampsiteTotal({
        namibianGuests,
        nonNamibianGuests,
      }),
    [namibianGuests, nonNamibianGuests],
  );

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!checkInDate || !checkOutDate) {
      setError('Please choose check-in and check-out dates.');
      return;
    }
    if (namibianGuests + nonNamibianGuests < 1) {
      setError('Add at least one guest.');
      return;
    }
    setLoading(true);
    try {
      const result = await submitFacilityBooking({
        payload: {
          bookingKind: 'campsite',
          checkInDate,
          checkOutDate,
          namibianGuests,
          nonNamibianGuests,
          roomId,
        },
        redirectTo,
      });
      if (!result.ok) {
        setError(result.error);
        return;
      }
      router.push(result.nextPath);
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-6 max-w-lg">
      <div className="alert alert-info">
        <span>
          N${HOTEL_ETUNA_FACILITY_RATES.campsiteNamibianPp} pp (Namibian) · N$
          {HOTEL_ETUNA_FACILITY_RATES.campsiteNonNamibianPp} pp (non-Namibian) · whole-site minimum N$
          {HOTEL_ETUNA_FACILITY_RATES.campsiteSiteMinimum}
        </span>
      </div>
      {error ? <div className="alert alert-error"><span>{error}</span></div> : null}
      <label className="form-control w-full">
        <span className="label-text font-semibold">Check-in</span>
        <Input type="date" value={checkInDate} onChange={(e) => setCheckInDate(e.target.value)} required />
      </label>
      <label className="form-control w-full">
        <span className="label-text font-semibold">Check-out</span>
        <Input type="date" value={checkOutDate} onChange={(e) => setCheckOutDate(e.target.value)} required />
      </label>
      <label className="form-control w-full">
        <span className="label-text font-semibold">Namibian guests</span>
        <Input
          type="number"
          min={0}
          value={namibianGuests}
          onChange={(e) => setNamibianGuests(Number(e.target.value) || 0)}
        />
      </label>
      <label className="form-control w-full">
        <span className="label-text font-semibold">Non-Namibian guests</span>
        <Input
          type="number"
          min={0}
          value={nonNamibianGuests}
          onChange={(e) => setNonNamibianGuests(Number(e.target.value) || 0)}
        />
      </label>
      <p className="text-lg font-semibold text-ci-secondary-chocolate">
        Estimated total: N${previewTotal.toFixed(2)}
      </p>
      <Button type="submit" variant="primary" className="rounded-full px-8" disabled={loading} aria-busy={loading}>
        {loading ? 'Booking…' : 'Reserve campsite'}
      </Button>
    </form>
  );
}
