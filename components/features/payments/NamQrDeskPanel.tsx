/**
 * NamQrDeskPanel — generate BoN NamQR v5.0 desk payment QR (payee-presented).
 * Location: components/features/payments/NamQrDeskPanel.tsx
 */

'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/Button';
import { NamQrQrDisplay } from '@/components/features/payments/NamQrQrDisplay';
import { NamQrSettlementNote } from '@/components/features/payments/NamQrSettlementNote';
import { NamQrAmountField } from '@/components/features/payments/NamQrAmountField';
import { NamQrBankReferenceField } from '@/components/features/payments/NamQrBankReferenceField';
import { formatCurrencyNAD } from '@/lib/formatters';

type NamQrDeskPanelProps = {
  /** When set (e.g. from booking folio), enables confirm-on-folio without re-entering ID */
  bookingId?: string;
  suggestedAmount?: number;
};

export function NamQrDeskPanel({ bookingId: bookingIdProp, suggestedAmount }: NamQrDeskPanelProps = {}) {
  const [amount, setAmount] = useState(
    suggestedAmount != null ? String(suggestedAmount) : ''
  );
  const [bookingId, setBookingId] = useState(bookingIdProp ?? '');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [bankReference, setBankReference] = useState('');
  const [confirmAmount, setConfirmAmount] = useState('');
  const [qr, setQr] = useState<{
    qrReference: string;
    qrImageUrl: string;
    qrPayload: string;
    expiresAt?: string;
  } | null>(null);

  useEffect(() => {
    if (bookingIdProp) setBookingId(bookingIdProp);
  }, [bookingIdProp]);

  useEffect(() => {
    if (suggestedAmount != null) {
      setAmount(String(suggestedAmount));
      setConfirmAmount(String(suggestedAmount));
    }
  }, [suggestedAmount]);

  async function generateQr() {
    setError(null);
    setSuccess(null);
    setQr(null);
    setIsLoading(true);
    try {
      const parsed = amount ? parseFloat(amount) : undefined;
      const res = await fetch('/api/payments/namqr/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: parsed && parsed > 0 ? parsed : undefined,
          bookingId: bookingId.trim() || undefined,
          presentationMode: parsed && parsed > 0 ? 'dynamic' : 'static',
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error?.message ?? json.message ?? 'Failed to generate NamQR');
      }
      setQr(json.data);
      if (parsed && parsed > 0) setConfirmAmount(String(parsed));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate NamQR');
    } finally {
      setIsLoading(false);
    }
  }

  async function confirmPayment() {
    const id = bookingId.trim();
    if (!id) {
      setError('Booking ID required to confirm payment on folio');
      return;
    }
    setError(null);
    setSuccess(null);
    setIsLoading(true);
    try {
      const res = await fetch('/api/payments/namqr/confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bookingId: id,
          amountPaid: parseFloat(confirmAmount),
          bankReference: bankReference.trim(),
          qrReference: qr?.qrReference,
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error?.message ?? json.message ?? 'Confirm failed');
      }
      setSuccess(
        `Recorded ${formatCurrencyNAD(json.data.amountSettled)}. Balance remaining: ${formatCurrencyNAD(json.data.balanceRemaining)}`
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Confirm failed');
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="space-y-4">
      <NamQrSettlementNote variant="desk" />
      <NamQrAmountField
        id="namqr-amount"
        label="Amount (NAD) — leave empty for open static QR"
        value={amount}
        onChange={setAmount}
      />
      {!bookingIdProp && (
        <div className="form-control">
          <label className="label" htmlFor="namqr-booking">
            <span className="label-text">Booking ID (optional)</span>
          </label>
          <input
            id="namqr-booking"
            type="text"
            className="input input-bordered w-full font-mono text-sm"
            placeholder="UUID"
            value={bookingId}
            onChange={(e) => setBookingId(e.target.value)}
          />
        </div>
      )}
      {error && <div className="alert alert-error text-sm">{error}</div>}
      <Button type="button" variant="primary" isLoading={isLoading} onClick={generateQr}>
        Generate NamQR
      </Button>
      {qr && <NamQrQrDisplay qr={qr} variant="desk" />}

      {bookingId.trim() && (
        <div className="space-y-3 border-t border-base-300 pt-4">
          <p className="text-sm font-medium">After guest pays in banking app</p>
          <NamQrAmountField
            id="namqr-confirm-amount"
            label="Amount received (NAD)"
            value={confirmAmount}
            onChange={setConfirmAmount}
          />
          <NamQrBankReferenceField
            id="namqr-bank-ref"
            label="Bank reference"
            value={bankReference}
            onChange={setBankReference}
          />
          <Button
            type="button"
            variant="secondary"
            isLoading={isLoading}
            disabled={!bankReference.trim() || !confirmAmount}
            onClick={confirmPayment}
          >
            Confirm on folio
          </Button>
        </div>
      )}

      {success && <p className="text-sm text-success">{success}</p>}
    </div>
  );
}
