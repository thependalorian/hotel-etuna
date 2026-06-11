/**
 * Guest stay detail — folio and room service
 *
 * Purpose: Single-stay folio panel for checked-in guests.
 * Location: /app/guest/stays/[bookingId]/page.tsx
 */

import { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { GuestFolioPanel } from '@/components/features/guest/GuestFolioPanel';
import { GuestServiceRequestCard } from '@/components/features/guest/GuestServiceRequestCard';
import { GuestDocumentVaultCard } from '@/components/features/guest/GuestDocumentVaultCard';
import { GuestFinancialDocumentsCard } from '@/components/features/guest/GuestFinancialDocumentsCard';
import { GuestStayService } from '@/lib/services/folio/GuestStayService';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';

export const dynamic = 'force-dynamic';

type PageProps = { params: Promise<{ bookingId: string }> };

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { bookingId } = await params;
  return {
    title: `Stay ${bookingId.slice(0, 8)}`,
    description: 'In-stay folio and room service at Hotel Etuna.',
  };
}

export default async function GuestStayDetailPage({ params }: PageProps) {
  const { bookingId } = await params;
  const session = await getServerSession(authOptions);
  const email = session?.user?.email;
  if (!email) {
    redirect(`/login?redirect=${encodeURIComponent(`/guest/stays/${bookingId}`)}`);
  }

  const guestStayService = new GuestStayService();
  const access = await guestStayService.findGuestBookingAccess(email, bookingId);

  if (!access) {
    return (
      <div className="text-center py-12">
        <h1 className="font-display text-2xl font-bold text-nude-900 mb-2">Stay not found</h1>
        <p className="text-nude-600 mb-6">
          This booking is not linked to your account or is no longer active.
        </p>
        <Link href="/guest" className="btn btn-primary">
          Back to my stays
        </Link>
      </div>
    );
  }

  const dueAmount =
    'totalAmount' in access && typeof access.totalAmount === 'number'
      ? access.totalAmount
      : 0;
  const paymentStatus = 'paymentStatus' in access ? access.paymentStatus : null;
  const depositDue =
    paymentStatus === 'pending' && dueAmount > 0
      ? { amount: dueAmount, currency: access.currency }
      : undefined;

  const bookingStatus = 'status' in access ? access.status : 'confirmed';

  return (
    <div className="space-y-6">
      <Link href="/guest" className="text-sm text-terracotta-700 hover:underline mb-4 inline-block">
        ← All stays
      </Link>
      <GuestFolioPanel
        bookingId={access.bookingId}
        bookingReference={access.bookingReference}
        bookingStatus={bookingStatus}
        roomNumbers={'roomNumbers' in access ? access.roomNumbers : []}
        depositDue={depositDue}
      />
      <GuestFinancialDocumentsCard bookingId={access.bookingId} />
      <GuestDocumentVaultCard bookingId={access.bookingId} />
      <GuestServiceRequestCard
        bookingId={access.bookingId}
        canRequest={bookingStatus === 'checked_in'}
      />
    </div>
  );
}
