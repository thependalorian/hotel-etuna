/**
 * Property hospitality VAT report (Hotel Etuna — NamRA output tax prep).
 * Location: app/(dashboard)/reports/property-vat/page.tsx
 */

import Link from 'next/link';
import { PropertyVatReportPanel } from '@/components/features/tax/PropertyVatReportPanel';
import { Button } from '@/components/ui/Button';
import { brand } from '@/lib/copy/brand';
import { dashboardCopy } from '@/lib/copy/dashboard';

export default function PropertyVatReportPage() {
  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-ink-900">Property VAT report</h1>
          <p className="text-ink-600 mt-1">
            {brand.name} guest room, F&amp;B, and folio supplies — separate from platform fees
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href="/payments/reconciliation">
            <Button variant="outline" size="sm">
              Cash reconciliation
            </Button>
          </Link>
          <Link href="/payments/platform-billing">
            <Button variant="outline" size="sm">
              {dashboardCopy.nav.platformFees}
            </Button>
          </Link>
        </div>
      </div>
      <PropertyVatReportPanel />
    </div>
  );
}
