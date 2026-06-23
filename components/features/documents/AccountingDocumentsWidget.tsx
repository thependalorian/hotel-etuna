/**
 * AccountingDocumentsWidget — document counts by type for selected period.
 * Location: components/features/documents/AccountingDocumentsWidget.tsx
 */

'use client';

import { useEffect, useState } from 'react';

type DocRow = { documentType: string };

export function AccountingDocumentsWidget({ from, to }: { from: string; to: string }) {
  const [counts, setCounts] = useState<Record<string, number>>({});

  useEffect(() => {
    void (async () => {
      const res = await fetch(`/api/documents?from=${from}&to=${to}`);
      const json = await res.json();
      if (!json.success) return;
      const rows = (json.data ?? []) as DocRow[];
      const tally: Record<string, number> = {};
      for (const row of rows) {
        tally[row.documentType] = (tally[row.documentType] ?? 0) + 1;
      }
      setCounts(tally);
    })();
  }, [from, to]);

  const entries = Object.entries(counts);
  if (entries.length === 0) return null;

  return (
    <div className="dashboard-card p-4">
      <h3 className="font-display font-semibold text-ink-900 mb-2">Financial PDFs issued</h3>
      <div className="stats stats-vertical sm:stats-horizontal shadow">
        {entries.map(([type, count]) => (
          <div key={type} className="stat">
            <div className="stat-title capitalize">{type.replace('_', ' ')}</div>
            <div className="stat-value text-primary">{count}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
