/**
 * GuestOpenBankingPisPanel — Pay folio via Namibian Open Banking PIS (PSD-12 step-up 2FA).
 * Location: components/features/guest/GuestOpenBankingPisPanel.tsx
 *
 * Production: bank-app redirect flow (OAuth) — manual token fields hidden unless sandbox flag is on.
 */

'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { HOTEL_ETUNA_SETTLEMENT } from '@/lib/platform/settlement-accounts';
import { isOpenBankingSandboxUi } from '@/lib/payments/open-banking-ui';

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
  const sandboxUi = isOpenBankingSandboxUi();
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

  async function startBankRedirect() {
    setError(null);
    setMessage(null);
    setBusy(true);
    try {
      const returnUrl = `${window.location.origin}/payment/open-banking/return?bookingId=${bookingId}`;
      const res = await fetch('/api/payments/open-banking/authorize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          bookingId,
          amount: payAmount,
          returnUrl,
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        throw new Error(json?.error?.message ?? 'Could not open your bank app.');
      }
      const url = json.data?.authorizationUrl ?? json.authorizationUrl;
      if (!url || typeof url !== 'string') {
        throw new Error('Bank redirect URL missing. Use NamQR or card instead.');
      }
      window.location.assign(url);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not open your bank app.');
      setBusy(false);
    }
  }

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
          {sandboxUi ? (
            <>
              <div className="badge badge-warning badge-soft">Developer sandbox</div>
              <p className="text-sm text-nude-600">
                Sandbox only — paste consent token and OTP from your test bank. Guests in production
                will use a bank-app redirect instead.
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
            </>
          ) : (
            <div className="space-y-3" role="status">
              <p className="text-sm text-nude-700">
                Pay from your Namibian banking app — you will approve the amount and one-time code in
                the bank, not on this page.
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
                onClick={() => void startBankRedirect()}
              >
                {busy ? 'Opening your bank…' : 'Continue to your bank'}
              </Button>
              <p className="text-xs text-nude-500">
                Prefer not to leave this page? Use NamQR or card in the tabs above.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
