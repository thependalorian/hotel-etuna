/**
 * Soc2CompliancePanel
 *
 * Purpose: SOC 2 audit agents UI + CPA evidence export (single API path).
 * Location: /components/features/compliance/Soc2CompliancePanel.tsx
 */

'use client';

import { useCallback, useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Soc2AuditDashboard } from '@/components/features/compliance/Soc2AuditDashboard';

export function Soc2CompliancePanel() {
  const [exporting, setExporting] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);

  const handleExport = useCallback(async () => {
    setExporting(true);
    setExportError(null);
    try {
      const res = await fetch('/api/compliance/soc2?action=export', {
        credentials: 'include',
      });
      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        const msg =
          json?.error?.message ?? json?.message ?? json?.error ?? res.statusText;
        throw new Error(typeof msg === 'string' ? msg : 'Export failed');
      }
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const disposition = res.headers.get('Content-Disposition');
      const match = disposition?.match(/filename="([^"]+)"/);
      a.download = match?.[1] ?? `soc2-evidence-${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (e) {
      setExportError(e instanceof Error ? e.message : 'Export failed');
    } finally {
      setExporting(false);
    }
  }, []);

  return (
    <div className="space-y-6">
      <Card className="p-4 flex flex-wrap items-center gap-3 justify-between">
        <p className="text-sm text-nude-600">
          Export includes control report plus audit log sample, user access list, and incidents for
          the observation period.
        </p>
        <Button variant="outline" onClick={() => void handleExport()} disabled={exporting}>
          {exporting ? 'Exporting…' : 'Download evidence package (JSON)'}
        </Button>
      </Card>
      {exportError && <p className="text-error text-sm">{exportError}</p>}
      <Soc2AuditDashboard />
    </div>
  );
}
