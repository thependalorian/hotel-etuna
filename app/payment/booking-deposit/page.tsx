import type { Metadata } from 'next';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { BookingDepositCheckout } from '@/components/payments/BookingDepositCheckout';
import { loadBookingWithGuest } from '@/lib/services/folio/guestStayAccess';
import { resolveBookingDepositAmount } from '@/lib/bookings/deposit';

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
 * 3. Guest confirms amount, then AdumoVirtualPaymentForm redirects to hosted payment
 * 4. On success, booking payment_status updated to 'paid'
 * 5. On failure, user can retry
 */

interface PageProps {
  searchParams: Promise<{ bookingId?: string }>;
}

export default async function BookingDepositPage({ searchParams }: PageProps) {
  const { bookingId } = await searchParams;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

  if (!bookingId) {
    return (
      <div className="max-w-lg mx-auto text-center py-16 px-4">
        <h1 className="font-display text-2xl font-bold text-ink-900 mb-4">
          Missing booking reference
        </h1>
        <p className="text-ink-600 mb-8">
          We could not find the booking you want to pay for. Please return to your booking.
        </p>
        <Button asChild>
          <Link href="/">Back to Home</Link>
        </Button>
      </div>
    );
  }

  let bookingReference = bookingId.slice(0, 8);
  let depositAmount = 0;
  let currency = 'NAD';
  let loadError: string | null = null;

  try {
    const { booking } = await loadBookingWithGuest(bookingId);
    bookingReference = booking.bookingReference;
    currency = booking.currency || 'NAD';
    depositAmount = resolveBookingDepositAmount(booking);
  } catch {
    loadError = 'We could not load this booking. Check the link or contact front desk.';
  }

  return (
    <div className="min-h-[60vh] bg-base-100 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="etuna-page-title mb-4">Secure Deposit Payment</h1>
          <p className="text-lg text-base-content/70">
            Review your deposit, then continue to our secure payment partner when you are ready.
          </p>
        </div>

        <div className="card bg-base-100">
          <div className="card-body p-8">
            {loadError ? (
              <div className="alert alert-error" role="alert">
                <span>{loadError}</span>
              </div>
            ) : (
              <BookingDepositCheckout
                bookingId={bookingId}
                bookingReference={bookingReference}
                amount={depositAmount}
                currency={currency}
                returnSuccessUrl={`${appUrl}/payment/success?bookingId=${bookingId}&purpose=booking_deposit`}
                returnFailUrl={`${appUrl}/payment/failed?bookingId=${bookingId}&purpose=booking_deposit`}
              />
            )}
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
