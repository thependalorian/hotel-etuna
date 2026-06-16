import type { Metadata } from 'next';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';

export const metadata: Metadata = {
  title: 'Bank payment',
  robots: { index: false, follow: false },
};

export const dynamic = 'force-dynamic';

type PageProps = {
  searchParams: Promise<{ bookingId?: string; state?: string; error?: string; ob_status?: string }>;
};

/**
 * Open Banking return landing — after bank app redirect.
 * Location: app/payment/open-banking/return/page.tsx
 */
export default async function OpenBankingReturnPage({ searchParams }: PageProps) {
  const { bookingId, error, ob_status } = await searchParams;
  const stayHref = bookingId ? `/guest/stays/${bookingId}` : '/guest';

  if (error) {
    return (
      <div className="max-w-lg mx-auto text-center py-16 px-4">
        <h1 className="font-display text-2xl font-bold text-nude-900 mb-4">Bank payment cancelled</h1>
        <p className="text-nude-600 mb-8">
          Your bank did not complete the payment. You can try again or use NamQR or card from your stay
          page.
        </p>
        <Button asChild>
          <Link href={stayHref}>Back to stay</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto text-center py-16 px-4">
      <h1 className="font-display text-2xl font-bold text-nude-900 mb-4">
        {ob_status === 'approved' ? 'Bank payment approved' : 'Return from your bank'}
      </h1>
      <p className="text-nude-600 mb-8">
        {ob_status === 'approved'
          ? 'Your bank approved this payment. Your folio will update shortly — open your stay to confirm.'
          : 'If your bank confirmed the payment, your folio will update shortly. Otherwise open your stay to retry with NamQR or card.'}
      </p>
      <Button asChild>
        <Link href={stayHref}>View my stay</Link>
      </Button>
    </div>
  );
}
