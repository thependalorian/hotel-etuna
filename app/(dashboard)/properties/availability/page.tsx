/**
 * Availability ledger page — staff stop-sell and daily inventory view (OSS W6)
 * Location: /app/(dashboard)/properties/availability/page.tsx
 */

import PageHeader from '@/components/shared/PageHeader';
import { AvailabilityLedgerPanel } from '@/components/features/property/AvailabilityLedgerPanel';

export const dynamic = 'force-dynamic';

export default function PropertyAvailabilityPage() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6">
      <PageHeader
        title="Room availability"
        description="Manage stop-sell and daily ledger restrictions across your active property."
      />
      <AvailabilityLedgerPanel />
    </div>
  );
}
