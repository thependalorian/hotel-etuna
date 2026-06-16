import type { Metadata } from 'next';
import {
  GuestOpenBankingConsentInvalid,
  GuestOpenBankingConsentScreen,
} from '@/components/features/guest/GuestOpenBankingConsentScreen';
import { verifyGuestOpenBankingState } from '@/lib/payments/guest-open-banking-oauth';

export const metadata: Metadata = {
  title: 'Bank consent',
  robots: { index: false, follow: false },
};

export const dynamic = 'force-dynamic';

type PageProps = {
  searchParams: Promise<{
    booking_id?: string;
    amount?: string;
    return_url?: string;
    state?: string;
    scope?: string;
  }>;
};

/**
 * Open Banking guest consent (sandbox ASPSP UI).
 * Location: app/payment/open-banking/consent/page.tsx
 */
export default async function OpenBankingConsentPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const bookingId = params.booking_id ?? '';
  const amount = params.amount ?? '';
  const returnUrl = params.return_url ?? '';
  const stateToken = params.state ?? '';
  const scope = params.scope ?? 'banking:payments.write';

  const verified = stateToken ? verifyGuestOpenBankingState(stateToken) : null;
  const valid =
    Boolean(bookingId && amount && returnUrl && stateToken && verified) &&
    verified!.bookingId === bookingId;

  if (!valid) {
    return <GuestOpenBankingConsentInvalid />;
  }

  return (
    <GuestOpenBankingConsentScreen
      bookingId={bookingId}
      amount={amount}
      returnUrl={returnUrl}
      scope={scope}
    />
  );
}
