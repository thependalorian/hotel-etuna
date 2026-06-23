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
import { PaymentDisclosure } from '@/components/features/payments/PaymentDisclosure';

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
    <div className="rounded-etuna-input border border-ci-primary/30 bg-ci-cream p-4 space-y-3">
      <div>
        <h4 className="font-display font-semibold text-ci-secondary-chocolate">Pay booking deposit</h4>
        <p className="text-sm text-ink-600 mt-1">
          Ref {bookingReference} · {currency} {amount.toFixed(2)} due. You will complete payment on
          Adumo&apos;s secure page.
        </p>
      </div>

      {error && (
        <div className="alert alert-error text-sm" role="alert">
          <span>{error}</span>
        </div>
      )}

      <PropertyHospitalityVatNote amount={amount} currency={currency} />

      {/* PSD-3 §14.3: show the exact charge and a disputes contact before the guest pays. */}
      <PaymentDisclosure amount={amount} currency={currency} />

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
