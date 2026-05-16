/**
 * Hospitality bookkeeping report (Namibia — trial balance, P&L, cash summary).
 * Location: app/(dashboard)/reports/accounting/page.tsx
 */

import Link from 'next/link';
import { HospitalityAccountingPanel } from '@/components/features/accounting/HospitalityAccountingPanel';
import { Button } from '@/components/ui/Button';

export default function HospitalityAccountingPage() {
  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-nude-900">Bookkeeping & accounts</h1>
          <p className="text-nude-600 mt-1">
            Hotel Etuna — income statement, trial balance, and cash summary (NAD / NamRA)
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href="/reports/property-vat">
            <Button variant="outline" size="sm">
              Property VAT
            </Button>
          </Link>
          <Link href="/payments/platform-billing">
            <Button variant="outline" size="sm">
              Buffr platform billing
            </Button>
          </Link>
        </div>
      </div>
      <HospitalityAccountingPanel />
    </div>
  );
}
