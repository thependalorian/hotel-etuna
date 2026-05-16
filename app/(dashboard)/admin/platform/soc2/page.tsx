/**
 * Platform admin — SOC 2 readiness (same UI as hub /compliance/soc2).
 * Location: /app/(dashboard)/admin/platform/soc2/page.tsx
 */

import Link from 'next/link';
import PageHeader from '@/components/shared/PageHeader';
import { Soc2CompliancePanel } from '@/components/features/compliance/Soc2CompliancePanel';

export default function PlatformSoc2Page() {
  return (
    <div className="max-w-5xl mx-auto p-6 space-y-6 animate-fade-in">
      <PageHeader
        title="SOC 2 readiness (platform)"
        description="Same NayaOne-baseline agents and evidence export as hub compliance. Hub staff can also use /compliance/soc2."
        actions={
          <Link href="/compliance/soc2" className="btn btn-outline min-h-[44px]">
            Hub compliance view
          </Link>
        }
      />
      <Soc2CompliancePanel />
    </div>
  );
}
