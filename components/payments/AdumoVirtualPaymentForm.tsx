/**
 * AdumoVirtualPaymentForm
 *
 * Purpose: Auto-submit form POST to Adumo Virtual hosted payment page (no PAN on our site).
 * Location: /components/payments/AdumoVirtualPaymentForm.tsx
 */

'use client';

import { useEffect, useRef, useState } from 'react';

export interface AdumoVirtualPaymentFormProps {
  bookingId: string;
  amount?: number;
  purpose?: 'booking_deposit' | 'folio_settle';
  returnSuccessUrl?: string;
  returnFailUrl?: string;
  /** When false, parent must gate mount until the guest confirms (deposit / card pay). Default true. */
  autoStart?: boolean;
  onError?: (message: string) => void;
}

export function AdumoVirtualPaymentForm({
  bookingId,
  amount,
  purpose = 'booking_deposit',
  returnSuccessUrl,
  returnFailUrl,
  autoStart = true,
  onError,
}: AdumoVirtualPaymentFormProps) {
  const formRef = useRef<HTMLFormElement>(null);
  const [redirecting, setRedirecting] = useState(autoStart);

  useEffect(() => {
    if (!autoStart) return;

    let cancelled = false;

    async function start() {
      try {
        const res = await fetch('/api/payments/virtual/initiate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({
            bookingId,
            amount,
            purpose,
            returnSuccessUrl:
              returnSuccessUrl ??
              `${window.location.origin}/payment/success?bookingId=${bookingId}`,
            returnFailUrl:
              returnFailUrl ??
              `${window.location.origin}/payment/failed?bookingId=${bookingId}`,
          }),
        });

        const json = await res.json();
        if (!res.ok) {
          const msg =
            json?.error?.message || json?.message || 'Could not start card payment';
          onError?.(msg);
          setRedirecting(false);
          return;
        }

        if (cancelled) return;

        const { actionUrl, fields } = json.data ?? json;
        const form = formRef.current;
        if (!form || !actionUrl || !fields) {
          onError?.('Invalid payment initiation response');
          setRedirecting(false);
          return;
        }

        form.action = actionUrl;
        form.method = 'POST';
        form.innerHTML = '';
        for (const [name, value] of Object.entries(fields as Record<string, string>)) {
          const input = document.createElement('input');
          input.type = 'hidden';
          input.name = name;
          input.value = String(value);
          form.appendChild(input);
        }
        form.submit();
      } catch {
        onError?.('Network error starting payment');
        setRedirecting(false);
      }
    }

    start();
    return () => {
      cancelled = true;
    };
  }, [autoStart, bookingId, amount, purpose, returnSuccessUrl, returnFailUrl, onError]);

  return (
    <div className="space-y-2" aria-busy={redirecting} aria-live="polite">
      {redirecting && (
        <div className="flex items-center gap-2 text-sm text-terracotta-800" role="status">
          <span className="loading loading-spinner loading-sm" aria-hidden />
          Redirecting to secure card payment…
        </div>
      )}
      <form ref={formRef} className="hidden" aria-hidden />
    </div>
  );
}
