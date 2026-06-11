/**
 * Property VAT report — hospitality output VAT for NamRA.
 * Location: app/(dashboard)/payments/property-vat/page.tsx
 */

import { Metadata } from 'next';
import Link from 'next/link';
import { PropertyVatReportPanel } from '@/components/features/tax/PropertyVatReportPanel';
import { Button } from '@/components/ui/Button';
import { brand } from '@/lib/copy/brand';
import { dashboardCopy } from '@/lib/copy/dashboard';

export const metadata: Metadata = {
  title: `Property VAT report | ${brand.name}`,
  description: `NamRA VAT on guest room and F&B supplies — separate from ${dashboardCopy.nav.platformFees.toLowerCase()}.`,
};

export default function PropertyVatPage() {
  return (
    <div className="max-w-5xl mx-auto p-6">
      <div className="flex flex-wrap items-start justify-between gap-4 mb-8">
        <div>
          <h1 className="font-display text-3xl font-bold text-nude-900 mb-2">Property VAT report</h1>
          <p className="text-nude-600">
            {brand.name} files its own VAT returns on guest hospitality. Platform fees are invoiced
            separately.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href="/payments/platform-billing">
            <Button variant="outline" size="sm">
              {dashboardCopy.nav.platformFees}
            </Button>
          </Link>
          <Link href="/payments/reconciliation">
            <Button variant="ghost" size="sm">
              Cash reconciliation
            </Button>
          </Link>
        </div>
      </div>
      <PropertyVatReportPanel />
    </div>
  );
}
