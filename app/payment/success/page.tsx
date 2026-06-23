import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Payment Confirmed',
  robots: { index: false, follow: false },
};

/**
 * Adumo Virtual — successful redirect landing page.
 * Location: app/payment/success/page.tsx
 */

import { Suspense } from 'react';
import { AdumoPaymentReturn } from '@/components/payments/AdumoPaymentReturn';

export const dynamic = 'force-dynamic';

export default function PaymentSuccessPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-[50vh] flex items-center justify-center text-ink-600">
          Verifying payment…
        </div>
      }
    >
      <AdumoPaymentReturn mode="success" />
    </Suspense>
  );
}
