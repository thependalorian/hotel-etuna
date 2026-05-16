/**
 * Soc2AuditDashboard
 *
 * Purpose: Run SOC 2 readiness agents and display gap analysis vs NayaOne baseline.
 * Location: /components/features/compliance/Soc2AuditDashboard.tsx
 */

'use client';

import { useCallback, useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';

type ControlRow = {
  controlId: string;
  title: string;
  status: string;
  category: string;
  evidence: string[];
  gaps: string[];
};

type AuditPayload = {
  overallScorePercent: number;
  summary: Record<string, number>;
  period: { from: string; to: string };
  agents: Array<{ agentName: string; scorePercent: number }>;
  controls: ControlRow[];
};

const STATUS_BADGE: Record<string, string> = {
  compliant: 'badge-success',
  partial: 'badge-warning',
  gap: 'badge-error',
  manual: 'badge-ghost',
  inherited: 'badge-info',
};

export function Soc2AuditDashboard() {
  const [report, setReport] = useState<AuditPayload | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const runAudit = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/compliance/soc2/audit', { credentials: 'include' });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error?.message || 'Audit failed');
      setReport(json.data as AuditPayload);
    } catch (e) {
      setReport(null);
      setError(e instanceof Error ? e.message : 'Audit failed');
    } finally {
      setLoading(false);
    }
  }, []);

  const gaps = report?.controls.filter((c) => c.status === 'gap') ?? [];

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <p className="text-sm text-nude-600 mb-4">
          Automated readiness against <strong>Security, Availability, Confidentiality</strong>{' '}
          (NayaOne SOC 2 Type II baseline). This is not a CPA attestation — use for gap analysis
          before Type I / Type II engagement.
        </p>
        <Button variant="primary" onClick={() => void runAudit()} disabled={loading}>
          {loading ? 'Running agents…' : 'Run SOC 2 audit agents'}
        </Button>
        {error && <p className="text-error text-sm mt-3">{error}</p>}
      </Card>

      {report && (
        <>
          <div className="grid gap-4 md:grid-cols-4">
            <Card className="p-4 text-center">
              <p className="text-3xl font-bold text-nude-900">{report.overallScorePercent}%</p>
              <p className="text-xs text-nude-600">Readiness score</p>
            </Card>
            {report.agents.map((a) => (
              <Card key={a.agentName} className="p-4 text-center">
                <p className="text-xl font-semibold">{a.scorePercent}%</p>
                <p className="text-xs text-nude-600">{a.agentName}</p>
              </Card>
            ))}
          </div>

          {gaps.length > 0 && (
            <Card className="p-6">
              <h2 className="font-semibold text-nude-900 mb-3">Priority gaps ({gaps.length})</h2>
              <ul className="space-y-2 text-sm">
                {gaps.map((c) => (
                  <li key={c.controlId} className="border-l-4 border-error pl-3">
                    <strong>{c.controlId}</strong> — {c.title}
                    {c.gaps[0] && <span className="block text-nude-600">{c.gaps[0]}</span>}
                  </li>
                ))}
              </ul>
            </Card>
          )}

          <Card className="p-6 overflow-x-auto">
            <table className="table table-sm w-full">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Control</th>
                  <th>Status</th>
                  <th>Evidence</th>
                </tr>
              </thead>
              <tbody>
                {report.controls.map((c) => (
                  <tr key={c.controlId}>
                    <td className="font-mono text-xs">{c.controlId}</td>
                    <td>{c.title}</td>
                    <td>
                      <span className={`badge ${STATUS_BADGE[c.status] ?? 'badge-ghost'}`}>
                        {c.status}
                      </span>
                    </td>
                    <td className="text-xs text-nude-600 max-w-md">
                      {c.evidence.slice(0, 2).join(' · ')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        </>
      )}
    </div>
  );
}
