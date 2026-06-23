/**
 * Guest dining reservation deposit — Adumo Virtual (Namibia).
 * Location: app/restaurant/reservation/pay/page.tsx
 */

import type { ReactNode } from 'react';
import { DiningReservationPayCard } from '@/components/payments/DiningReservationPayCard';
import NavigationHeader from '@/components/sections/landing/NavigationHeader';
import Footer from '@/components/shared/Footer';

type PageProps = {
  searchParams: Promise<{ code?: string }>;
};

function PayShell({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-surface-background">
      <NavigationHeader />
      <main className="flex flex-1 flex-col justify-center px-4 py-8 sm:px-6 sm:py-12">
        <div className="mx-auto w-full max-w-lg">{children}</div>
      </main>
      <Footer />
    </div>
  );
}

export default async function DiningReservationPayPage({ searchParams }: PageProps) {
  const { code } = await searchParams;

  if (!code?.trim()) {
    return (
      <PayShell>
        <h1 className="font-display text-xl font-semibold text-ci-secondary-chocolate sm:text-2xl">
          Pay reservation deposit
        </h1>
        <p className="mt-4 text-sm text-ink-600 sm:text-base">
          Missing booking code. Use the link from your confirmation email.
        </p>
      </PayShell>
    );
  }

  const bookingCode = code.trim().toUpperCase();

  return (
    <PayShell>
      <h1 className="font-display text-xl font-semibold text-ci-secondary-chocolate sm:text-2xl">
        Pay reservation deposit
      </h1>
      <p className="mt-2 text-sm text-ink-600 sm:text-base">
        Booking code{' '}
        <strong className="break-all font-mono">{bookingCode}</strong> — you will be redirected to
        Adumo&apos;s secure card page (Namibia).
      </p>
      <div className="mt-6">
        <DiningReservationPayCard bookingCode={code.trim()} />
      </div>
    </PayShell>
  );
}
