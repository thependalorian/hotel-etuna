/**
 * AdumoPaymentReturn
 *
 * Purpose: Handle Adumo Virtual redirect query params and confirm with backend.
 * Location: /components/payments/AdumoPaymentReturn.tsx
 */

'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';

type AdumoPaymentReturnProps = {
  mode: 'success' | 'failed';
};

export function AdumoPaymentReturn({ mode }: AdumoPaymentReturnProps) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [message, setMessage] = useState('Verifying payment…');

  const diningCode =
    searchParams.get('diningCode')?.trim().toUpperCase() ||
    searchParams.get('Variable2')?.trim().toUpperCase() ||
    null;

  const diningRetryHref = diningCode
    ? `/restaurant/reservation/pay?code=${encodeURIComponent(diningCode)}`
    : null;

  useEffect(() => {
    const merchantReference =
      searchParams.get('_MERCHANTREFERENCE') ||
      searchParams.get('merchantReference');
    const responseToken = searchParams.get('_RESPONSE_TOKEN');
    const transactionIndex = searchParams.get('_TRANSACTIONINDEX');
    const result = searchParams.get('_RESULT');
    // Adumo docs show VARIABLE1 (uppercase) in response table — handle both casings
    const bookingId =
      searchParams.get('bookingId') ||
      searchParams.get('Variable1') ||
      searchParams.get('VARIABLE1');
    // Parse _STATUS for richer decline messages (APPROVED / DECLINED / USER_CANCELLED)
    const status = searchParams.get('_STATUS') ?? '';

    if (mode === 'failed' || result === '-1') {
      const reason = status === 'USER_CANCELLED'
        ? 'Payment cancelled. You can try again or pay at reception.'
        : 'Card payment declined. Please check your card details or pay at reception.';
      // eslint-disable-next-line react-hooks/exhaustive-deps, react-hooks/set-state-in-effect
      setMessage(reason);
      return;
    }

    if (!merchantReference || !responseToken) {
      setMessage('Missing payment confirmation from Adumo. If you were charged, contact reception.');
      return;
    }

    fetch('/api/payments/virtual/confirm', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({
        merchantReference,
        responseToken,
        transactionIndex: transactionIndex ?? undefined,
        result: result ?? undefined,
      }),
    })
      .then(async (res) => {
        const json = await res.json();
        if (!res.ok) {
          setMessage(json?.error?.message || 'Payment verification failed.');
          return;
        }
        setMessage('Payment successful. Thank you!');
        if (diningCode) {
          setTimeout(() => router.push('/dining'), 2500);
          return;
        }
        const target = bookingId ? `/guest/stays/${bookingId}` : '/guest';
        setTimeout(() => router.push(target), 2500);
      })
      .catch(() => {
        setMessage('Could not verify payment. Please contact reception with your booking reference.');
      });
  }, [mode, searchParams, router, diningCode]);

  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4 px-4 py-8 text-center sm:gap-6">
      <h1 className="font-display text-xl text-terracotta-900 sm:text-2xl">
        {mode === 'success' ? 'Payment' : 'Payment issue'}
      </h1>
      <p className="max-w-md text-sm text-terracotta-800 sm:text-base">{message}</p>
      <div className="flex w-full max-w-xs flex-col gap-2 sm:max-w-sm sm:flex-row sm:justify-center">
        {diningRetryHref ? (
          <Button asChild className="w-full sm:w-auto min-h-11">
            <Link href={diningRetryHref}>Try payment again</Link>
          </Button>
        ) : null}
        <Button
          asChild
          variant={diningRetryHref ? 'outline' : 'primary'}
          className="w-full sm:w-auto min-h-11"
        >
          <Link href={diningCode ? '/dining' : '/guest'}>
            {diningCode ? 'Back to dining' : 'Back to guest hub'}
          </Link>
        </Button>
      </div>
    </div>
  );
}
