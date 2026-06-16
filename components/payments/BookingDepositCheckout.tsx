/**
 * BookingDepositCheckout
 *
 * Purpose: Guest-facing deposit pay gate — disclosure and explicit confirm before Adumo redirect.
 * Location: /components/payments/BookingDepositCheckout.tsx
 */

'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { AdumoVirtualPaymentForm } from '@/components/payments/AdumoVirtualPaymentForm';
import { PropertyHospitalityVatNote } from '@/components/features/tax/PropertyHospitalityVatNote';
import { PaymentDisclosure } from '@/components/features/payments/PaymentDisclosure';

export interface BookingDepositCheckoutProps {
  bookingId: string;
  bookingReference: string;
  amount: number;
  currency?: string;
  returnSuccessUrl: string;
  returnFailUrl: string;
}

export function BookingDepositCheckout({
  bookingId,
  bookingReference,
  amount,
  currency = 'NAD',
  returnSuccessUrl,
  returnFailUrl,
}: BookingDepositCheckoutProps) {
  const [paying, setPaying] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!Number.isFinite(amount) || amount <= 0) {
    return (
      <p className="text-sm text-error" role="alert">
        No deposit is due for this booking. Contact front desk if you need help.
      </p>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <p className="text-sm text-base-content/80">
          Booking <span className="font-semibold">{bookingReference}</span> ·{' '}
          <span className="font-semibold">
            {currency} {amount.toFixed(2)}
          </span>{' '}
          deposit due. You will complete payment on Adumo&apos;s secure page.
        </p>
      </div>

      {error && (
        <div className="alert alert-error text-sm" role="alert">
          <span>{error}</span>
        </div>
      )}

      <PropertyHospitalityVatNote amount={amount} currency={currency} />
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
