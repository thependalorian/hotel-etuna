/**
 * PaymentsDeskBookingPicker
 *
 * Purpose: Search bookings by reference or guest name on the payments desk (no UUID paste).
 * Location: /components/features/payments/PaymentsDeskBookingPicker.tsx
 */

'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { apiUrl } from '@/lib/utils/api-url';
import { format } from 'date-fns';
import { Button } from '@/components/ui/Button';

export type DeskBookingOption = {
  id: string;
  bookingReference: string;
  status: string;
  checkInDate: string | null;
  checkOutDate: string | null;
  guestName: string;
};

type PaymentsDeskBookingPickerProps = {
  value: string;
  onChange: (bookingId: string, option?: DeskBookingOption) => void;
};

export function PaymentsDeskBookingPicker({ value, onChange }: PaymentsDeskBookingPickerProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<DeskBookingOption[]>([]);
  const [selected, setSelected] = useState<DeskBookingOption | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!value) {
      setSelected(null);
      return;
    }
    if (selected?.id === value) return;
    setSelected({
      id: value,
      bookingReference: value.slice(0, 8),
      status: '',
      checkInDate: null,
      checkOutDate: null,
      guestName: '',
    });
  }, [value, selected?.id]);

  useEffect(() => {
    const trimmed = query.trim();
    if (trimmed.length < 2) {
      setResults([]);
      setError(null);
      return;
    }

    const timer = window.setTimeout(() => {
      void (async () => {
        setBusy(true);
        setError(null);
        try {
          const res = await fetch(apiUrl(`/api/bookings/search?q=${encodeURIComponent(trimmed)}`), {
            credentials: 'include',
          });
          const json = await res.json();
          if (!res.ok) {
            throw new Error(json?.error?.message ?? 'Search failed');
          }
          setResults(json.data?.items ?? []);
        } catch (e) {
          setResults([]);
          setError(e instanceof Error ? e.message : 'Search failed');
        } finally {
          setBusy(false);
        }
      })();
    }, 300);

    return () => window.clearTimeout(timer);
  }, [query]);

  function pick(option: DeskBookingOption) {
    setSelected(option);
    setQuery('');
    setResults([]);
    onChange(option.id, option);
  }

  function clear() {
    setSelected(null);
    setQuery('');
    setResults([]);
    onChange('');
  }

  function formatStay(option: DeskBookingOption): string {
    if (!option.checkInDate) return '';
    const inLabel = format(new Date(option.checkInDate), 'd MMM yyyy');
    const outLabel = option.checkOutDate
      ? format(new Date(option.checkOutDate), 'd MMM yyyy')
      : '';
    return outLabel ? `${inLabel} – ${outLabel}` : inLabel;
  }

  return (
    <div className="space-y-3">
      <label className="label" htmlFor="desk-booking-search">
        <span className="label-text font-medium">Find booking</span>
      </label>

      {selected ? (
        <div className="rounded-etuna-input border border-base-300 bg-base-200/50 p-4 space-y-2">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div>
              <p className="font-semibold">{selected.bookingReference || selected.id.slice(0, 8)}</p>
              {selected.guestName ? (
                <p className="text-sm text-base-content/80">{selected.guestName}</p>
              ) : null}
              {formatStay(selected) ? (
                <p className="text-xs text-base-content/60">{formatStay(selected)}</p>
              ) : null}
            </div>
            <Button type="button" variant="ghost" size="sm" onClick={clear}>
              Change
            </Button>
          </div>
          <Button asChild size="sm" variant="outline">
            <Link href={`/bookings/${selected.id}#documents`}>Open booking →</Link>
          </Button>
        </div>
      ) : (
        <>
          <input
            id="desk-booking-search"
            type="search"
            className="input input-bordered w-full"
            placeholder="Booking reference, guest name, or booking ID"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            autoComplete="off"
          />
          <p className="text-xs text-base-content/60">
            Search by reference (e.g. ETU-…), guest name, or paste the booking ID.
          </p>
          {busy && <p className="text-sm text-base-content/70">Searching…</p>}
          {error && (
            <div className="alert alert-error text-sm py-2" role="alert">
              <span>{error}</span>
            </div>
          )}
          {results.length > 0 && (
            <ul className="menu menu-sm bg-base-100 border border-base-300 rounded-etuna-input max-h-56 overflow-y-auto">
              {results.map((item) => (
                <li key={item.id}>
                  <button type="button" onClick={() => pick(item)}>
                    <span>
                      <span className="font-medium">{item.bookingReference}</span>
                      <span className="block text-xs opacity-70">
                        {item.guestName}
                        {formatStay(item) ? ` · ${formatStay(item)}` : ''} · {item.status}
                      </span>
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
          {query.trim().length >= 2 && !busy && results.length === 0 && !error && (
            <p className="text-sm text-warning">No bookings match that search.</p>
          )}
        </>
      )}
    </div>
  );
}
