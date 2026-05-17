/**
 * Platform billing — Buffr fees, settlement accounts, monthly invoices.
 * Location: app/(dashboard)/payments/platform-billing/page.tsx
 */

import { Metadata } from 'next';
import { PlatformBillingPanel } from '@/components/features/billing/PlatformBillingPanel';

export const metadata: Metadata = {
  title: 'Platform billing | Hotel Etuna',
  description: 'Buffr platform fees, settlement accounts, and monthly invoices.',
};

export default function PlatformBillingPage() {
  return (
    <div className="max-w-5xl mx-auto px-4 py-6 sm:p-6">
      <h1 className="font-display text-3xl font-bold text-nude-900 mb-2">Platform billing</h1>
      <p className="text-nude-600 mb-4">
        Guest card payments settle to Hotel Etuna. Buffr Financial Services invoices subscription
        and processing fees monthly.
      </p>
      <p className="text-sm text-nude-600 mb-8">
        <a href="/reports/property-vat" className="link link-primary">
          Property VAT report
        </a>{' '}
        — Hotel Etuna&apos;s own NamRA VAT on room and F&B (separate from Buffr invoices below).
      </p>
      <PlatformBillingPanel />
    </div>
  );
}
