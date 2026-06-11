import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Complete Your Booking',
  description: 'Secure your Hotel Etuna booking with a card deposit.',
  robots: { index: false, follow: false },
};

/**
 * Booking Deposit Payment Page
 *
 * Purpose: Collect deposit payment via Adumo Virtual for online bookings
 * Location: /app/payment/booking-deposit/page.tsx
 *
 * Flow:
 * 1. User creates booking (via BookingForm)
 * 2. Redirected here with bookingId
 * 3. AdumoVirtualPaymentForm initiates hosted payment
 * 4. On success, booking payment_status updated to 'paid'
 * 5. On failure, user can retry
 */

import { Suspense } from 'react';
import Link from 'next/link';
import { AdumoVirtualPaymentForm } from '@/components/payments/AdumoVirtualPaymentForm';
import LoadingSpinner from '@/components/shared/LoadingSpinner';

interface PageProps {
  searchParams: Promise<{ bookingId?: string }>;
}

export default async function BookingDepositPage({ searchParams }: PageProps) {
  const { bookingId } = await searchParams;

  if (!bookingId) {
    return (
      <div className="max-w-lg mx-auto text-center py-16 px-4">
        <h1 className="font-display text-2xl font-bold text-nude-900 mb-4">
          Missing booking reference
        </h1>
        <p className="text-nude-600 mb-8">
          We could not find the booking you want to pay for. Please return to your booking.
        </p>
        <Link href="/" className="btn btn-primary rounded-full px-6">
          Back to Home
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-base-100 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="etuna-page-title mb-4">Secure Deposit Payment</h1>
          <p className="text-lg text-base-content/70">
            Complete your deposit payment to confirm your booking. You will be redirected to our
            secure payment partner.
          </p>
        </div>

        <div className="card bg-base-100 shadow-xl">
          <div className="card-body p-8">
            <Suspense
              fallback={
                <div className="flex items-center justify-center py-8">
                  <LoadingSpinner size="lg" text="Preparing secure payment..." />
                </div>
              }
            >
              <AdumoVirtualPaymentForm
                bookingId={bookingId}
                purpose="booking_deposit"
                amount={undefined}
                returnSuccessUrl={`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/payment/success?bookingId=${bookingId}&purpose=booking_deposit`}
                returnFailUrl={`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/payment/failed?bookingId=${bookingId}&purpose=booking_deposit`}
              />
            </Suspense>
          </div>
        </div>

        <div className="mt-8 text-center text-sm text-base-content/60">
          <p>
            By completing this payment, you agree to our{' '}
            <a href="/legal/terms" className="link link-primary">
              Terms of Service
            </a>{' '}
            and{' '}
            <a href="/legal/privacy" className="link link-primary">
              Privacy Policy
            </a>
            .
          </p>
          <p className="mt-2">
            Need help? Contact us at{' '}
            <a href="mailto:frontdesk@hoteletuna.com" className="link link-primary">
              frontdesk@hoteletuna.com
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
