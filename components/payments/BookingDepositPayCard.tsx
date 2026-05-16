/**
 * BookingDepositPayCard
 *
 * Purpose: Start Adumo Virtual hosted payment for a booking deposit (no PAN on our site).
 * Location: /components/payments/BookingDepositPayCard.tsx
 */

'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { AdumoVirtualPaymentForm } from '@/components/payments/AdumoVirtualPaymentForm';
import { PropertyHospitalityVatNote } from '@/components/features/tax/PropertyHospitalityVatNote';

export interface BookingDepositPayCardProps {
  bookingId: string;
  bookingReference: string;
  amount: number;
  currency?: string;
  returnSuccessUrl?: string;
  returnFailUrl?: string;
}

export function BookingDepositPayCard({
  bookingId,
  bookingReference,
  amount,
  currency = 'NAD',
  returnSuccessUrl,
  returnFailUrl,
}: BookingDepositPayCardProps) {
  const [paying, setPaying] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!Number.isFinite(amount) || amount <= 0) {
    return null;
  }

  return (
    <div className="rounded-lg border border-khaki-600/30 bg-khaki-50 p-4 space-y-3">
      <div>
        <h4 className="font-display font-semibold text-terracotta-900">Pay booking deposit</h4>
        <p className="text-sm text-terracotta-800 mt-1">
          Ref {bookingReference} · {currency} {amount.toFixed(2)} due. You will complete payment on
          Adumo&apos;s secure page.
        </p>
      </div>

      {error && <p className="text-sm text-error">{error}</p>}

      <PropertyHospitalityVatNote amount={amount} currency={currency} />

      {!paying ? (
        <Button
          type="button"
          onClick={() => {
            setError(null);
            setPaying(true);
          }}
        >
          Pay {currency} {amount.toFixed(2)} with card
        </Button>
      ) : (
        <AdumoVirtualPaymentForm
          bookingId={bookingId}
          amount={amount}
          purpose="booking_deposit"
          returnSuccessUrl={returnSuccessUrl}
          returnFailUrl={returnFailUrl}
          onError={(msg) => {
            setPaying(false);
            setError(msg);
          }}
        />
      )}
    </div>
  );
}
