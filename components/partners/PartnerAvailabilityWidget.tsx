/**
 * Partner availability widget.
 *
 * Purpose: Check partner room availability with partner property pre-selected.
 * Location: /components/partners/PartnerAvailabilityWidget.tsx
 */

'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/Button';

interface PartnerAvailabilityWidgetProps {
  propertyId: string;
}

interface AvailabilityRoom {
  id: string;
  roomType: string;
  roomNumber: string;
  maxOccupancy: number;
  baseRate: string | number | null;
  status: string;
}

export function PartnerAvailabilityWidget({ propertyId }: PartnerAvailabilityWidgetProps) {
  const [checkInDate, setCheckInDate] = useState('');
  const [checkOutDate, setCheckOutDate] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<AvailabilityRoom[]>([]);

  const checkAvailability = async () => {
    setError(null);
    setResults([]);

    if (!checkInDate || !checkOutDate) {
      setError('Please select check-in and check-out dates.');
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch('/api/bookings/availability', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          propertyId,
          checkInDate,
          checkOutDate,
        }),
      });
      if (!response.ok) {
        throw new Error('Unable to fetch availability.');
      }

      const payload = (await response.json()) as AvailabilityRoom[] | { data?: AvailabilityRoom[] };
      if (Array.isArray(payload)) {
        setResults(payload);
      } else {
        setResults(payload.data ?? []);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Availability check failed.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <section className="bg-nude-50 rounded-etuna-card p-8 mb-10">
      <h2 className="font-display text-2xl text-ci-accent-terracotta mb-6">Check Availability</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <div>
          <label className="block text-sm font-medium text-ink-700 mb-2">Check-in</label>
          <input
            type="date"
            value={checkInDate}
            onChange={(event) => setCheckInDate(event.target.value)}
            className="w-full px-4 py-2 border border-nude-300 rounded-etuna-input"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-ink-700 mb-2">Check-out</label>
          <input
            type="date"
            value={checkOutDate}
            onChange={(event) => setCheckOutDate(event.target.value)}
            className="w-full px-4 py-2 border border-nude-300 rounded-etuna-input"
          />
        </div>
      </div>

      <Button variant="primary" size="lg" onClick={checkAvailability} disabled={isLoading}>
        {isLoading ? 'Checking...' : 'Check Availability'}
      </Button>

      {error ? <p className="text-sm text-red-600 mt-3">{error}</p> : null}

      {results.length > 0 ? (
        <div className="mt-6 space-y-3">
          <h3 className="font-semibold text-ci-accent-terracotta">Available Rooms</h3>
          {results.map((room) => (
            <div key={room.id} className="bg-white border border-nude-200 rounded-etuna-input p-4">
              <p className="font-medium text-ink-900">
                {room.roomType} ({room.roomNumber})
              </p>
              <p className="text-sm text-ink-600">
                Max guests: {room.maxOccupancy} · Rate: NAD {room.baseRate ?? 'N/A'}
              </p>
            </div>
          ))}
        </div>
      ) : null}
    </section>
  );
}
