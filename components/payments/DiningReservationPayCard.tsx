/**
 * DiningReservationPayCard — Adumo Virtual deposit for restaurant table reservation.
 * Location: /components/payments/DiningReservationPayCard.tsx
 */

'use client';

import { useEffect, useRef, useState } from 'react';

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
  }, [bookingCode, returnSuccessUrl, returnFailUrl, onError]);

  return (
    <div className="space-y-2">
      {redirecting && (
        <p className="text-sm text-terracotta-800">
          Redirecting to Adumo secure card payment…
        </p>
      )}
      <form ref={formRef} className="hidden" aria-hidden />
    </div>
  );
}
