/**
 * Guest dining reservation deposit — Adumo Virtual (Namibia).
 * Location: app/restaurant/reservation/pay/page.tsx
 */

import { DiningReservationPayCard } from '@/components/payments/DiningReservationPayCard';

type PageProps = {
  searchParams: Promise<{ code?: string }>;
};

export default async function DiningReservationPayPage({ searchParams }: PageProps) {
  const { code } = await searchParams;

  if (!code?.trim()) {
    return (
      <main className="mx-auto max-w-lg p-8">
        <h1 className="text-2xl font-semibold text-gray-900">Pay reservation deposit</h1>
        <p className="mt-4 text-gray-600">Missing booking code. Use the link from your confirmation email.</p>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-lg p-8">
      <h1 className="text-2xl font-semibold text-gray-900">Pay reservation deposit</h1>
      <p className="mt-2 text-sm text-gray-600">
        Booking code <strong>{code.toUpperCase()}</strong> — you will be redirected to Adumo&apos;s secure card page.
      </p>
      <div className="mt-6">
        <DiningReservationPayCard bookingCode={code.trim()} />
      </div>
    </main>
  );
}
