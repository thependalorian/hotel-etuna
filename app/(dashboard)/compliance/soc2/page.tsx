/**
 * SOC 2 readiness dashboard — hub admin.
 * Location: /app/(dashboard)/compliance/soc2/page.tsx
 */

import Link from 'next/link';
import PageHeader from '@/components/shared/PageHeader';
import { Soc2CompliancePanel } from '@/components/features/compliance/Soc2CompliancePanel';

export default function Soc2CompliancePage() {
  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="SOC 2 readiness"
        description="Automated gap analysis vs NayaOne Type II baseline (Security, Availability, Confidentiality). Not a CPA attestation."
        actions={
          <Link href="/compliance/kyc" className="btn btn-outline min-h-[44px]">
            KYC queue
          </Link>
        }
      />
      <Soc2CompliancePanel />
    </div>
  );
}
