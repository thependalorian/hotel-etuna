/**
 * GuestOpenBankingConsentScreen — sandbox ASPSP consent + step-up 2FA (PSD-12).
 * Location: components/features/guest/GuestOpenBankingConsentScreen.tsx
 */

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

export type GuestOpenBankingConsentProps = {
  bookingId: string;
  amount: string;
  returnUrl: string;
  scope: string;
};

export function GuestOpenBankingConsentScreen({
  bookingId,
  amount,
  returnUrl,
  scope,
}: GuestOpenBankingConsentProps) {
  const router = useRouter();
  const [otp, setOtp] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function approve() {
    setError(null);
    if (otp.trim().length < 4) {
      setError('Enter the one-time code from your banking app (sandbox: any 4+ digits).');
      return;
    }
    setBusy(true);
    try {
      const target = new URL(returnUrl);
      target.searchParams.set('bookingId', bookingId);
      target.searchParams.set('ob_status', 'approved');
      router.replace(target.toString());
    } catch {
      setError('Return URL is invalid.');
      setBusy(false);
    }
  }

  function cancel() {
    try {
      const target = new URL(returnUrl);
      target.searchParams.set('error', 'cancelled');
      target.searchParams.set('bookingId', bookingId);
      router.replace(target.toString());
    } catch {
      router.replace('/guest');
    }
  }

  return (
    <div className="max-w-md mx-auto py-12 px-4">
      <div className="card bg-base-100 shadow-xl">
        <div className="card-body gap-4">
          <h1 className="font-display text-xl font-bold text-nude-900">Approve bank payment</h1>
          <p className="text-sm text-nude-600">
            Hotel Etuna is requesting <strong>NAD {amount}</strong> from your linked account. This
            simulates your Namibian banking app consent screen (Open Banking PIS).
          </p>
          <div className="rounded-lg bg-nude-50 border border-nude-200 p-3 text-sm text-nude-700">
            <p>Booking: {bookingId.slice(0, 8)}…</p>
            <p>Scope: {scope}</p>
          </div>
          <Input
            label="One-time code (2FA)"
            inputMode="numeric"
            autoComplete="one-time-code"
            value={otp}
            onChange={(e) => setOtp(e.target.value)}
            helperText="In production your bank app generates this code. Sandbox: enter any 4+ digits."
            error={error ?? undefined}
          />
          <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
            <Button type="button" variant="outline" onClick={cancel} disabled={busy}>
              Cancel
            </Button>
            <Button type="button" onClick={() => void approve()} disabled={busy} isLoading={busy}>
              Approve payment
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

export function GuestOpenBankingConsentInvalid() {
  return (
    <div className="max-w-lg mx-auto py-16 px-4 text-center space-y-4">
      <h1 className="font-display text-2xl font-bold text-nude-900">Bank link expired</h1>
      <p className="text-nude-600">
        This payment authorization link is missing or has expired. Open your stay and try bank payment
        again, or use NamQR or card.
      </p>
      <Button asChild>
        <a href="/guest">Back to guest hub</a>
      </Button>
    </div>
  );
}
