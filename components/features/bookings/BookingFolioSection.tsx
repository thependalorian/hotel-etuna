/**
 * BookingFolioSection
 *
 * Purpose: Staff view of in-stay folio — line items, balance, cash/card settlement.
 * Location: /components/features/bookings/BookingFolioSection.tsx
 */

'use client';

import { useCallback, useEffect, useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { AdumoVirtualPaymentForm } from '@/components/payments/AdumoVirtualPaymentForm';
import { NamQrDeskPanel } from '@/components/features/payments/NamQrDeskPanel';
import { FolioVatBreakdown } from '@/components/features/folio/FolioVatBreakdown';
import type { FolioSummary } from '@/lib/types/folio';

interface BookingFolioSectionProps {
  bookingId: string;
  bookingStatus: string;
}

export function BookingFolioSection({ bookingId, bookingStatus }: BookingFolioSectionProps) {
  const [folio, setFolio] = useState<FolioSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [amount, setAmount] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const [payWithCard, setPayWithCard] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/guest/stays/${bookingId}/folio`);
      const json = await res.json();
      if (!res.ok) {
        throw new Error(json?.error?.message || 'Failed to load folio');
      }
      setFolio(json.data);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load folio');
    } finally {
      setLoading(false);
    }
  }, [bookingId]);

  useEffect(() => {
    void load();
  }, [load]);

  const settle = async (paymentMethod: 'cash' | 'card') => {
    setBusy(true);
    setMessage(null);
    try {
      const body: Record<string, unknown> = {
        paymentMethod,
        amountPaid: amount ? Number.parseFloat(amount) : undefined,
      };
      const res = await fetch(`/api/guest/stays/${bookingId}/settle`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error?.message || 'Settlement failed');
      setMessage(json.data?.message || 'Payment recorded');
      setAmount('');
      await load();
    } catch (e) {
      setMessage(e instanceof Error ? e.message : 'Settlement failed');
    } finally {
      setBusy(false);
    }
  };

  if (bookingStatus !== 'checked_in' && bookingStatus !== 'checked_out') {
    return null;
  }

  return (
    <Card variant="elevated" className="p-6">
      <h3 className="font-display text-lg font-semibold text-nude-900 mb-2">Stay folio</h3>
      <p className="text-sm text-nude-600 mb-4">
        Room rate, F&amp;B, and incidentals on this booking. Settle before check-out when balance is open.
      </p>

      {loading && <div className="skeleton h-24 w-full rounded-lg" aria-hidden />}

      {error && <p className="text-sm text-error mb-3">{error}</p>}

      {!loading && folio && (
        <>
          <div className="grid grid-cols-2 gap-3 mb-4">
            <div className="rounded-lg bg-nude-50 border border-nude-200 p-3">
              <p className="text-xs text-nude-600 uppercase">Balance due</p>
              <p className="text-xl font-bold text-nude-900">
                {folio.currency} {folio.balanceDue.toFixed(2)}
              </p>
            </div>
            <div className="rounded-lg bg-nude-50 border border-nude-200 p-3">
              <p className="text-xs text-nude-600 uppercase">Folio status</p>
              <p className="text-sm font-semibold capitalize text-nude-900">
                {folio.folioClosedAt ? 'Closed' : 'Open'}
              </p>
            </div>
          </div>

          {folio.vat && <FolioVatBreakdown vat={folio.vat} className="mb-4" />}

          {folio.lines.length > 0 && (
            <ul className="divide-y divide-nude-200 text-sm mb-4 max-h-48 overflow-y-auto">
              {folio.lines.map((line) => (
                <li key={line.id} className="py-2 flex justify-between gap-2">
                  <span>
                    {line.description}
                    <span className="text-nude-500 ml-1">({line.chargeType})</span>
                  </span>
                  <span className="font-mono shrink-0">
                    {line.currency} {line.amount.toFixed(2)}
                  </span>
                </li>
              ))}
            </ul>
          )}

          {folio.balanceDue > 0 && !folio.folioClosedAt && bookingStatus === 'checked_in' && (
            <div className="space-y-3 border-t border-nude-200 pt-4">
              <label className="form-control w-full">
                <span className="label-text text-sm">Payment amount (optional partial)</span>
                <input
                  type="number"
                  step="0.01"
                  className="input input-bordered w-full"
                  placeholder={folio.balanceDue.toFixed(2)}
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                />
              </label>
              <div className="flex flex-wrap gap-2">
                <Button size="sm" disabled={busy} onClick={() => void settle('cash')}>
                  Record cash
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={busy || payWithCard}
                  onClick={() => {
                    setPayWithCard(true);
                    setMessage(null);
                  }}
                >
                  Pay card (Adumo)
                </Button>
              </div>
              {payWithCard && folio && (
                <AdumoVirtualPaymentForm
                  bookingId={bookingId}
                  amount={
                    amount
                      ? Math.min(Number.parseFloat(amount) || folio.balanceDue, folio.balanceDue)
                      : folio.balanceDue
                  }
                  purpose="folio_settle"
                  onError={(err) => {
                    setPayWithCard(false);
                    setMessage(err);
                  }}
                />
              )}
              <NamQrDeskPanel
                bookingId={bookingId}
                suggestedAmount={
                  amount
                    ? Math.min(Number.parseFloat(amount) || folio.balanceDue, folio.balanceDue)
                    : folio.balanceDue
                }
              />
            </div>
          )}
        </>
      )}

      {message && <p className="text-sm text-semantic-success mt-3">{message}</p>}
    </Card>
  );
}
