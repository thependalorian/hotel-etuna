/**
 * NamQrDeskPanel — generate BoN NamQR v5.0 desk payment QR (payee-presented).
 * Location: components/features/payments/NamQrDeskPanel.tsx
 */

'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/Button';
import { HOTEL_ETUNA_SETTLEMENT } from '@/lib/platform/settlement-accounts';

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
        `Recorded NAD ${json.data.amountSettled}. Balance remaining: NAD ${json.data.balanceRemaining}`
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Confirm failed');
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-base-content/70">
        Guest pays to Hotel Etuna Nedbank{' '}
        <span className="font-mono">{HOTEL_ETUNA_SETTLEMENT.accountNumber}</span> via banking
        app scan. Payload follows NamQR v5.0 (BoN May 2025).
      </p>
      <div className="form-control">
        <label className="label" htmlFor="namqr-amount">
          <span className="label-text">Amount (NAD) — leave empty for open static QR</span>
        </label>
        <input
          id="namqr-amount"
          type="number"
          step="0.01"
          min="0"
          className="input input-bordered w-full"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
        />
      </div>
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
      {qr && (
        <div className="card bg-base-200 p-4 space-y-3">
          <p className="text-sm">
            Reference: <span className="font-mono">{qr.qrReference}</span>
          </p>
          {qr.expiresAt && (
            <p className="text-xs text-base-content/60">
              Expires: {new Date(qr.expiresAt).toLocaleString()}
            </p>
          )}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={qr.qrImageUrl}
            alt="NamQR payment code"
            className="mx-auto max-w-[240px] rounded-lg bg-white p-2"
          />
          <details className="text-xs">
            <summary className="cursor-pointer">EMV payload</summary>
            <pre className="mt-2 overflow-x-auto break-all whitespace-pre-wrap">{qr.qrPayload}</pre>
          </details>
        </div>
      )}

      {bookingId.trim() && (
        <div className="space-y-3 border-t border-base-300 pt-4">
          <p className="text-sm font-medium">After guest pays in banking app</p>
          <div className="form-control">
            <label className="label" htmlFor="namqr-confirm-amount">
              <span className="label-text">Amount received (NAD)</span>
            </label>
            <input
              id="namqr-confirm-amount"
              type="number"
              step="0.01"
              className="input input-bordered w-full"
              value={confirmAmount}
              onChange={(e) => setConfirmAmount(e.target.value)}
            />
          </div>
          <div className="form-control">
            <label className="label" htmlFor="namqr-bank-ref">
              <span className="label-text">Bank reference</span>
            </label>
            <input
              id="namqr-bank-ref"
              type="text"
              className="input input-bordered w-full"
              value={bankReference}
              onChange={(e) => setBankReference(e.target.value)}
            />
          </div>
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
