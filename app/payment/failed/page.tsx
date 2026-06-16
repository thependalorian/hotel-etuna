import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Payment Not Completed',
  robots: { index: false, follow: false },
};

/**
 * Adumo Virtual — failed redirect landing page.
 * Location: app/payment/failed/page.tsx
 */

import Link from 'next/link';
import { Button } from '@/components/ui/Button';

export const dynamic = 'force-dynamic';

type PageProps = {
  searchParams: Promise<{ bookingId?: string }>;
};

export default async function PaymentFailedPage({ searchParams }: PageProps) {
  const { bookingId } = await searchParams;
  const stayHref = bookingId ? `/guest/stays/${bookingId}` : '/guest';
  const cardRetryHref = bookingId
    ? `/payment/booking-deposit?bookingId=${bookingId}`
    : '/guest';

  return (
    <div className="max-w-lg mx-auto text-center py-16 px-4">
      <h1 className="font-display text-2xl font-bold text-nude-900 mb-4">
        Payment not completed
      </h1>
      <p className="text-nude-600 mb-8">
        Your card payment was declined or cancelled. You can try again with card, pay with NamQR
        from your stay page, or pay cash at the front desk.
      </p>
      <div className="flex flex-col sm:flex-row flex-wrap justify-center gap-3">
        {bookingId ? (
          <Button asChild>
            <Link href={cardRetryHref}>Retry card payment</Link>
          </Button>
        ) : null}
        <Button asChild variant={bookingId ? 'outline' : 'primary'}>
          <Link href={stayHref}>{bookingId ? 'Pay with NamQR on stay' : 'Return to guest hub'}</Link>
        </Button>
      </div>
    </div>
  );
}
