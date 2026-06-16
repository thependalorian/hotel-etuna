/**
 * BookingFolioSection
 *
 * Purpose: Staff view of in-stay folio — line items, balance, cash/card settlement.
 * Location: /components/features/booking/BookingFolioSection.tsx
 */

'use client';

import { useCallback, useEffect, useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { AdumoVirtualPaymentForm } from '@/components/payments/AdumoVirtualPaymentForm';
import { NamQrDeskPanel } from '@/components/features/payments/NamQrDeskPanel';
import { FolioVatBreakdown } from '@/components/features/folio/FolioVatBreakdown';
import {
  FolioVoidTransactionDialog,
  type FolioVoidChargeTarget,
} from '@/components/features/folio/FolioVoidTransactionDialog';
import { FolioBalanceStat } from '@/components/features/folio/FolioBalanceStat';
import { FolioLinesTable } from '@/components/features/folio/FolioLinesTable';
import { FolioPartialAmountField } from '@/components/features/folio/FolioPartialAmountField';
import { FolioCashCardPayRow } from '@/components/features/folio/FolioCashCardPayRow';
import { formatFolioAmount } from '@/lib/utils/money';
import { resolveFolioPayAmount } from '@/lib/utils/folio-pay';
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
  const [voidTarget, setVoidTarget] = useState<FolioVoidChargeTarget | null>(null);

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

  const folioVisibleStatuses = ['checked_in', 'stayover', 'due_out', 'checked_out'];
  if (!folioVisibleStatuses.includes(bookingStatus)) {
    return null;
  }

  const canVoidCharges = Boolean(
    folio &&
      !folio.folioClosedAt &&
      ['checked_in', 'stayover', 'due_out'].includes(bookingStatus)
  );

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
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
            <FolioBalanceStat
              label="Balance due"
              value={formatFolioAmount(folio.currency, folio.balanceDue)}
            />
            <FolioBalanceStat
              label="Folio status"
              value={folio.folioClosedAt ? 'Closed' : 'Open'}
              valueClassName="text-sm font-semibold capitalize text-nude-900"
            />
          </div>

          {folio.vat && <FolioVatBreakdown vat={folio.vat} className="mb-4" />}

          <FolioLinesTable
            lines={folio.lines}
            variant="staff"
            canVoidCharges={canVoidCharges}
            onVoidCharge={setVoidTarget}
          />

          {folio.balanceDue > 0 &&
            !folio.folioClosedAt &&
            ['checked_in', 'stayover', 'due_out'].includes(bookingStatus) && (
            <div className="space-y-3 border-t border-nude-200 pt-4">
              <FolioPartialAmountField
                label="Payment amount (optional partial)"
                value={amount}
                onChange={setAmount}
                balanceDue={folio.balanceDue}
                currency={folio.currency}
                id="desk-folio-partial-amount"
              />
              <FolioCashCardPayRow
                busy={busy}
                payWithCard={payWithCard}
                onCash={() => void settle('cash')}
                onStartCard={() => {
                  setPayWithCard(true);
                  setMessage(null);
                }}
              />
              {payWithCard && folio && (
                <AdumoVirtualPaymentForm
                  bookingId={bookingId}
                  amount={resolveFolioPayAmount(amount, folio.balanceDue)}
                  purpose="folio_settle"
                  onError={(err) => {
                    setPayWithCard(false);
                    setMessage(err);
                  }}
                />
              )}
              <NamQrDeskPanel
                bookingId={bookingId}
                suggestedAmount={resolveFolioPayAmount(amount, folio.balanceDue)}
              />
            </div>
          )}
        </>
      )}

      {message && <p className="text-sm text-semantic-success mt-3">{message}</p>}

      <FolioVoidTransactionDialog
        charge={voidTarget}
        open={voidTarget !== null}
        onClose={() => setVoidTarget(null)}
        onVoided={() => void load()}
      />
    </Card>
  );
}

