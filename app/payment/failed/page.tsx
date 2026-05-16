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
  const backHref = bookingId ? `/guest/stays/${bookingId}` : '/guest';

  return (
    <div className="max-w-lg mx-auto text-center py-16 px-4">
      <h1 className="font-display text-2xl font-bold text-nude-900 mb-4">
        Payment not completed
      </h1>
      <p className="text-nude-600 mb-8">
        Your card payment was declined or cancelled. You can try again with card or pay cash at
        the front desk.
      </p>
      <Link href={backHref}>
        <Button variant="outline">Return to stay</Button>
      </Link>
    </div>
  );
}
