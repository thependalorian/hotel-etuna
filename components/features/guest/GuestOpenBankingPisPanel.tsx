/**
 * GuestOpenBankingPisPanel — Pay folio via Namibian Open Banking PIS (PSD-12 step-up 2FA).
 * Location: components/features/guest/GuestOpenBankingPisPanel.tsx
 *
 * Purpose: Minimal guest surface for POST /api/payments/open-banking/initiate (pis rail).
 * Production flows obtain accessToken via bank OAuth; sandbox collects token + OTP explicitly.
 */

'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { HOTEL_ETUNA_SETTLEMENT } from '@/lib/platform/settlement-accounts';

type GuestOpenBankingPisPanelProps = {
  bookingId: string;
  balanceDue: number;
  onUpdated?: () => void;
};

export function GuestOpenBankingPisPanel({
  bookingId,
  balanceDue,
  onUpdated,
}: GuestOpenBankingPisPanelProps) {
  const [open, setOpen] = useState(false);
  const [amount, setAmount] = useState(balanceDue > 0 ? balanceDue.toFixed(2) : '');
  const [payerAccountId, setPayerAccountId] = useState('');
  const [accessToken, setAccessToken] = useState('');
  const [otp, setOtp] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const payAmount = Math.min(
    Math.max(parseFloat(amount) || balanceDue, 0.01),
    balanceDue,
  );

  async function initiatePayment() {
    setError(null);
    setMessage(null);
    if (!payerAccountId.trim() || payerAccountId.length < 8) {
      setError('Enter your linked bank account ID from your banking app.');
      return;
    }
    if (!accessToken.trim() || accessToken.length < 20) {
      setError('Complete bank consent in your app, then paste the access token here.');
      return;
    }
    if (!otp.trim() || otp.length < 4) {
      setError('Enter the one-time code from your bank (required before each payment).');
      return;
    }

    setBusy(true);
    try {
      const res = await fetch('/api/payments/open-banking/initiate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          paymentRail: 'pis',
          bookingId,
          amount: payAmount,
          accessToken: accessToken.trim(),
          payerAccountId: payerAccountId.trim(),
          payeeIdentifier: HOTEL_ETUNA_SETTLEMENT.accountNumber,
          payeeName: HOTEL_ETUNA_SETTLEMENT.legalName,
          payeeAccountType: 'bank',
          paymentStream: 'NRTC',
          authMethod: 'otp_sms',
          authValue: otp.trim(),
          description: `Hotel Etuna folio ${bookingId.slice(0, 8)}`,
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        throw new Error(json?.error?.message ?? 'Bank payment could not be started.');
      }
      setMessage(
        `Payment submitted (${json.data?.status ?? 'pending'}). Reference: ${json.data?.paymentReference ?? '—'}`,
      );
      setOtp('');
      onUpdated?.();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Payment failed. Please try again.');
    } finally {
      setBusy(false);
    }
  }

  if (balanceDue <= 0) return null;

  return (
    <div className="rounded-xl border border-nude-200 bg-nude-50/80 p-4 mt-4">
      <button
        type="button"
        className="flex w-full items-center justify-between text-left font-semibold text-nude-900"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
      >
        <span>Pay via bank (Open Banking)</span>
        <span className="text-sm font-normal text-nude-600">{open ? 'Hide' : 'Show'}</span>
      </button>
      {open && (
        <div className="mt-4 space-y-3">
          <p className="text-sm text-nude-600">
            We take care of you — pay from your Namibian bank app. A one-time code is required for
            each payment (regulatory requirement).
          </p>
          <label className="form-control w-full">
            <span className="label-text">Amount (NAD)</span>
            <input
              type="number"
              step="0.01"
              min="0.01"
              max={balanceDue}
              className="input input-bordered w-full"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
          </label>
          <label className="form-control w-full">
            <span className="label-text">Your bank account ID</span>
            <input
              type="text"
              className="input input-bordered w-full"
              value={payerAccountId}
              onChange={(e) => setPayerAccountId(e.target.value)}
              autoComplete="off"
            />
          </label>
          <label className="form-control w-full">
            <span className="label-text">Bank consent token</span>
            <input
              type="password"
              className="input input-bordered w-full"
              value={accessToken}
              onChange={(e) => setAccessToken(e.target.value)}
              autoComplete="off"
            />
          </label>
          <label className="form-control w-full">
            <span className="label-text">SMS one-time code</span>
            <input
              type="text"
              inputMode="numeric"
              className="input input-bordered w-full"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              autoComplete="one-time-code"
            />
          </label>
          {error && (
            <div className="alert alert-error text-sm" role="alert">
              <span>{error}</span>
            </div>
          )}
          {message && (
            <div className="alert alert-success text-sm" role="status">
              <span>{message}</span>
            </div>
          )}
          <Button
            className="rounded-full px-6"
            disabled={busy}
            onClick={() => void initiatePayment()}
          >
            {busy ? 'Processing…' : 'Confirm bank payment'}
          </Button>
        </div>
      )}
    </div>
  );
}
