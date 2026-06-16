'use client';

/**
 * Conference hall session booking form (N$1,200 per day, 08:00–17:00).
 * Location: components/features/booking/ConferenceBookingForm.tsx
 */

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { HOTEL_ETUNA_FACILITY_RATES } from '@/lib/constants/hotel-etuna-room-types';
import { submitFacilityBooking } from '@/components/features/booking/facility-booking-submit';

type ConferenceBookingFormProps = {
  roomId: string;
  /** After success, navigate here (default: payment deposit flow). */
  redirectTo?: string;
};

export function ConferenceBookingForm({ roomId, redirectTo }: ConferenceBookingFormProps) {
  const router = useRouter();
  const [sessionDate, setSessionDate] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!sessionDate) {
      setError('Please choose a session date.');
      return;
    }
    setLoading(true);
    try {
      const result = await submitFacilityBooking({
        payload: {
          bookingKind: 'conference',
          sessionDate,
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
          N${HOTEL_ETUNA_FACILITY_RATES.conferenceSession} per session · 08:00–17:00 · one booking per calendar day
        </span>
      </div>
      {error ? <div className="alert alert-error"><span>{error}</span></div> : null}
      <label className="form-control w-full">
        <span className="label-text font-semibold">Session date</span>
        <Input type="date" value={sessionDate} onChange={(e) => setSessionDate(e.target.value)} required />
      </label>
      <Button type="submit" variant="primary" className="rounded-full px-8" disabled={loading} aria-busy={loading}>
        {loading ? 'Booking…' : `Reserve hall — N$${HOTEL_ETUNA_FACILITY_RATES.conferenceSession}`}
      </Button>
    </form>
  );
}
