'use client';

/**
 * CommissionReportTable — hub partner commission aggregates with CSV export.
 * Location: components/features/reports/CommissionReportTable.tsx
 */

import { useCallback, useEffect, useState } from 'react';
import { apiUrl } from '@/lib/utils/api-url';
import LoadingSpinner from '@/components/shared/LoadingSpinner';
import { Button } from '@/components/ui/Button';

type CommissionRow = {
  partnerId: string;
  partnerName: string;
  bookingCount: number;
  commissionTotal: number;
};

export default function CommissionReportTable() {
  const [rows, setRows] = useState<CommissionRow[]>([]);
  const [grandTotal, setGrandTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');

  const fetchReport = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (from) params.set('from', from);
    if (to) params.set('to', to);
    const res = await fetch(apiUrl(`/api/reports/commission?${params}`), { credentials: 'include' });
    if (res.ok) {
      const data = await res.json();
      setRows(data.rows ?? []);
      setGrandTotal(data.grandTotal ?? 0);
    }
    setLoading(false);
  }, [from, to]);

  useEffect(() => {
    fetchReport();
  }, [fetchReport]);

  const exportCsv = () => {
    const header = 'Partner,Bookings,Commission (NAD)\n';
    const body = rows
      .map((r) => `"${r.partnerName}",${r.bookingCount},${r.commissionTotal.toFixed(2)}`)
      .join('\n');
    const blob = new Blob([header + body + `\n"Total",,${grandTotal.toFixed(2)}`], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `commission-report-${from || 'all'}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return <LoadingSpinner size="lg" text="Loading commission report…" />;
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-3 items-end">
        <label className="form-control">
          <span className="label-text">From</span>
          <input type="date" className="input input-bordered" value={from} onChange={(e) => setFrom(e.target.value)} />
        </label>
        <label className="form-control">
          <span className="label-text">To</span>
          <input type="date" className="input input-bordered" value={to} onChange={(e) => setTo(e.target.value)} />
        </label>
        <Button type="button" onClick={fetchReport}>
          Apply
        </Button>
        <button type="button" className="btn btn-outline rounded-full px-6" onClick={exportCsv}>
          Export CSV
        </button>
      </div>

      <div className="overflow-x-auto table-scroll">
        <table className="table table-zebra">
          <thead>
            <tr>
              <th>Partner</th>
              <th>Bookings</th>
              <th className="text-right">Commission (NAD)</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={3} className="text-center text-base-content/60 py-8">
                  No commission data for this period.
                </td>
              </tr>
            ) : (
              rows.map((r) => (
                <tr key={r.partnerId}>
                  <td>{r.partnerName}</td>
                  <td>{r.bookingCount}</td>
                  <td className="text-right">N$ {r.commissionTotal.toFixed(2)}</td>
                </tr>
              ))
            )}
          </tbody>
          {rows.length > 0 && (
            <tfoot>
              <tr>
                <th>Total</th>
                <th />
                <th className="text-right">N$ {grandTotal.toFixed(2)}</th>
              </tr>
            </tfoot>
          )}
        </table>
      </div>
    </div>
  );
}
