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

type AdumoPaymentReturnProps = {
  mode: 'success' | 'failed';
};

export function AdumoPaymentReturn({ mode }: AdumoPaymentReturnProps) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [message, setMessage] = useState('Verifying payment…');

  useEffect(() => {
    const merchantReference =
      searchParams.get('_MERCHANTREFERENCE') ||
      searchParams.get('merchantReference');
    const responseToken = searchParams.get('_RESPONSE_TOKEN');
    const transactionIndex = searchParams.get('_TRANSACTIONINDEX');
    const result = searchParams.get('_RESULT');
    const bookingId = searchParams.get('bookingId') || searchParams.get('Variable1');

    if (mode === 'failed' || result === '-1') {
      setMessage('Payment was declined or cancelled. You can try again or pay at reception.');
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
        const target = bookingId ? `/guest/stays/${bookingId}` : '/guest';
        setTimeout(() => router.push(target), 2500);
      })
      .catch(() => {
        setMessage('Could not verify payment. Please contact reception with your booking reference.');
      });
  }, [mode, searchParams, router]);

  return (
    <div className="min-h-[50vh] flex flex-col items-center justify-center px-4 text-center gap-6">
      <h1 className="font-display text-2xl text-terracotta-900">
        {mode === 'success' ? 'Payment' : 'Payment issue'}
      </h1>
      <p className="text-terracotta-800 max-w-md">{message}</p>
      <Link href="/guest" className="btn btn-primary">
        Back to guest hub
      </Link>
    </div>
  );
}
