/**
 * ReconciliationDocumentsPanel — PDFs issued in reconciliation date range.
 * Location: components/features/documents/ReconciliationDocumentsPanel.tsx
 */

'use client';

import { useEffect, useState } from 'react';

type DocRow = {
  id: string;
  referenceNumber: string;
  documentType: string;
  generatedAt: string;
  bookingId: string;
};

export function ReconciliationDocumentsPanel({ date }: { date: string }) {
  const [rows, setRows] = useState<DocRow[]>([]);

  useEffect(() => {
    const from = `${date}T00:00:00.000Z`;
    const to = `${date}T23:59:59.999Z`;
    void (async () => {
      const res = await fetch(`/api/documents?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`);
      const json = await res.json();
      if (json.success) setRows(json.data ?? []);
    })();
  }, [date]);

  if (rows.length === 0) return null;

  return (
    <div className="card bg-base-100 shadow mt-6">
      <div className="card-body">
        <h2 className="card-title text-lg">Financial documents issued</h2>
        <div className="overflow-x-auto table-scroll">
          <table className="table table-sm">
            <thead>
              <tr>
                <th>Reference</th>
                <th>Type</th>
                <th>Booking</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id}>
                  <td className="font-mono text-xs">{r.referenceNumber}</td>
                  <td>{r.documentType}</td>
                  <td className="font-mono text-xs">{r.bookingId.slice(0, 8)}…</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
