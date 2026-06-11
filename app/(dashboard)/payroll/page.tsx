/**
 * Payroll dashboard page — Namibia PAYE/SSC for Hotel Etuna staff.
 * Location: app/(dashboard)/payroll/page.tsx
 */

import PageHeader from '@/components/shared/PageHeader';
import { PayrollDashboard } from '@/components/features/payroll/PayrollDashboard';

export const dynamic = 'force-dynamic';

export default function PayrollPage() {
  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Payroll"
        description="Namibia PAYE and Social Security payroll runs for your team"
      />
      <PayrollDashboard />
    </div>
  );
}
