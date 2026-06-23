/**
 * Partner commission report — hub dashboard.
 * Location: app/(dashboard)/reports/commission/page.tsx
 */

import CommissionReportTable from '@/components/features/reports/CommissionReportTable';

export const dynamic = 'force-dynamic';

export default function CommissionReportPage() {
  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="etuna-page-title mb-2">Partner Commission Report</h1>
        <p className="text-base-content/70">
          Commission totals by lodging partner and check-in date range.
        </p>
      </div>
      <div className="card bg-base-100">
        <div className="card-body">
          <CommissionReportTable />
        </div>
      </div>
    </div>
  );
}
