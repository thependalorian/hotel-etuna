/**
 * Soc2AuditPanel — deprecated; use Soc2CompliancePanel on /compliance/soc2 or /admin/platform/soc2.
 * Location: /components/features/admin/compliance/Soc2AuditPanel.tsx
 */

'use client';

import { useCallback, useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import type { Soc2AuditReport, Soc2ControlStatus } from '@/lib/compliance/soc2/types';

function statusBadge(status: Soc2ControlStatus) {
  const map: Record<Soc2ControlStatus, string> = {
    compliant: 'badge-success',
    partial: 'badge-warning',
    gap: 'badge-error',
    manual: 'badge-info',
    inherited: 'badge-ghost',
  };
  return map[status] ?? 'badge-outline';
}

export function Soc2AuditPanel() {
  const [report, setReport] = useState<Soc2AuditReport | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const runAudit = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/admin/platform/compliance/soc2-audit');
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || json?.message || 'Audit failed');
      setReport(json.data);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Audit failed');
    } finally {
      setLoading(false);
    }
  }, []);

  return (
    <Card variant="elevated" className="p-6">
      <div className="flex flex-wrap items-start justify-between gap-4 mb-4">
        <div>
          <h2 className="font-display text-xl font-bold text-nude-900">SOC 2 readiness</h2>
          <p className="text-sm text-nude-600 mt-1 max-w-prose">
            Six automated agents benchmark Hotel Etuna against NayaOne Type II themes (Security,
            Availability, Confidentiality). For internal gap analysis — not CPA attestation.
          </p>
        </div>
        <Button variant="primary" onClick={() => void runAudit()} isLoading={loading}>
          Run audit agents
        </Button>
      </div>

      {error && <p className="text-sm text-error mb-4">{error}</p>}

      {report && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
            <div className="rounded-lg bg-nude-50 border border-nude-200 p-3 text-center">
              <p className="text-xs text-nude-600">Score</p>
              <p className="text-2xl font-bold">{report.overallScorePercent}%</p>
            </div>
            <div className="rounded-lg bg-success/10 p-3 text-center">
              <p className="text-xs">Compliant</p>
              <p className="text-xl font-bold">{report.summary.compliant}</p>
            </div>
            <div className="rounded-lg bg-warning/10 p-3 text-center">
              <p className="text-xs">Partial</p>
              <p className="text-xl font-bold">{report.summary.partial}</p>
            </div>
            <div className="rounded-lg bg-error/10 p-3 text-center">
              <p className="text-xs">Gaps</p>
              <p className="text-xl font-bold">{report.summary.gap}</p>
            </div>
            <div className="rounded-lg bg-info/10 p-3 text-center">
              <p className="text-xs">Manual</p>
              <p className="text-xl font-bold">{report.summary.manual}</p>
            </div>
          </div>

          {report.executiveBullets && (
            <ul className="list-disc list-inside text-sm text-nude-700 space-y-1">
              {report.executiveBullets.map((b) => (
                <li key={b}>{b}</li>
              ))}
            </ul>
          )}

          {report.agents.map((agent) => (
            <div key={agent.agentId} className="border border-nude-200 rounded-lg p-4">
              <div className="flex justify-between items-center mb-2">
                <h3 className="font-semibold text-nude-900">{agent.agentName}</h3>
                <span className="text-sm font-mono">{agent.scorePercent}%</span>
              </div>
              <div className="overflow-x-auto">
                <table className="table table-sm w-full">
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Control</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {agent.controls.map((c) => (
                      <tr key={c.controlId}>
                        <td className="font-mono text-xs">{c.controlId}</td>
                        <td className="text-xs">{c.title}</td>
                        <td>
                          <span className={`badge badge-sm ${statusBadge(c.status)}`}>
                            {c.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))}

          <p className="text-xs text-nude-500">{report.disclaimer}</p>
        </div>
      )}
    </Card>
  );
}
