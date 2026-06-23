/**
 * Platform fees — settlement accounts and monthly invoices (operator-only route).
 * Location: app/(dashboard)/payments/platform-billing/page.tsx
 */

import { Metadata } from 'next';
import { PlatformBillingPanel } from '@/components/features/billing/PlatformBillingPanel';
import { brand } from '@/lib/copy/brand';
import { dashboardCopy } from '@/lib/copy/dashboard';

export const metadata: Metadata = {
  title: `${dashboardCopy.nav.platformFees} | ${brand.name}`,
  description: dashboardCopy.billing.platformFeesDesc,
};

export default function PlatformBillingPage() {
  return (
    <div className="max-w-5xl mx-auto px-4 py-6 sm:p-6">
      <h1 className="font-display text-3xl font-bold text-ink-900 mb-2">
        {dashboardCopy.billing.platformFeesTitle}
      </h1>
      <p className="text-ink-600 mb-4">{dashboardCopy.billing.platformFeesDesc}</p>
      <p className="text-sm text-ink-600 mb-8">
        <a href="/reports/property-vat" className="link link-primary">
          Property VAT report
        </a>{' '}
        — {brand.name}&apos;s own NamRA VAT on room and F&amp;B (separate from platform fee invoices
        below).
      </p>
      <PlatformBillingPanel />
    </div>
  );
}
