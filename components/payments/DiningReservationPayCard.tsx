/**
 * DiningReservationPayCard — Adumo Virtual deposit for restaurant table reservation.
 * Location: /components/payments/DiningReservationPayCard.tsx
 */

'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';

export interface DiningReservationPayCardProps {
  bookingCode: string;
  returnSuccessUrl?: string;
  returnFailUrl?: string;
  onError?: (message: string) => void;
}

export function DiningReservationPayCard({
  bookingCode,
  returnSuccessUrl,
  returnFailUrl,
  onError,
}: DiningReservationPayCardProps) {
  const formRef = useRef<HTMLFormElement>(null);
  const [redirecting, setRedirecting] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const retryHref = `/restaurant/reservation/pay?code=${encodeURIComponent(bookingCode)}`;

  useEffect(() => {
    let cancelled = false;

    async function start() {
      try {
        const res = await fetch('/api/restaurant/reservations/pay/initiate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({
            bookingCode,
            returnSuccessUrl:
              returnSuccessUrl ??
              `${window.location.origin}/payment/success?diningCode=${encodeURIComponent(bookingCode)}`,
            returnFailUrl:
              returnFailUrl ??
              `${window.location.origin}/payment/failed?diningCode=${encodeURIComponent(bookingCode)}`,
          }),
        });

        const json = await res.json();
        if (!res.ok) {
          const msg =
            json?.error?.message || json?.message || 'Could not start card payment';
          setErrorMessage(msg);
          onError?.(msg);
          setRedirecting(false);
          return;
        }

        if (cancelled) return;

        const { actionUrl, fields } = json.data ?? json;
        const form = formRef.current;
        if (!form || !actionUrl || !fields) {
          const msg = 'Invalid payment initiation response';
          setErrorMessage(msg);
          onError?.(msg);
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
        const msg = 'Network error starting payment';
        setErrorMessage(msg);
        onError?.(msg);
        setRedirecting(false);
      }
    }

    start();
    return () => {
      cancelled = true;
    };
  }, [bookingCode, returnSuccessUrl, returnFailUrl, onError]);

  if (errorMessage) {
    return (
      <div className="alert alert-error flex flex-col items-stretch gap-3 text-sm sm:flex-row sm:items-center">
        <span className="flex-1">{errorMessage}</span>
        <Link href={retryHref} className="btn btn-sm btn-outline min-h-10 shrink-0">
          Try again
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {redirecting && (
        <p className="text-sm text-terracotta-800 sm:text-base">
          Redirecting to Adumo secure card payment…
        </p>
      )}
      <form ref={formRef} className="hidden" aria-hidden />
    </div>
  );
}
