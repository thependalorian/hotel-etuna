/**
 * PayrollDashboard
 *
 * Purpose: Hub staff payroll — list periods, create draft runs, approve, export PAYE/SSC CSV.
 * Location: /components/features/payroll/PayrollDashboard.tsx
 */

'use client';

import { useCallback, useEffect, useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { NAMIBIA_PAYROLL_EMPLOYER_REF, PAYE_FY_LABEL } from '@/lib/platform/namibia-payroll';

type PayrollPeriod = {
  id: string;
  periodLabel: string;
  startDate: string;
  endDate: string;
  payDate: string;
  status: string;
};

type PayrollRun = {
  id: string;
  periodId: string;
  status: string;
  runNumber: number;
  totalGross: number;
  totalPaye: number;
  totalNet: number;
};

type ApiEnvelope<T> = { data?: T; error?: string; message?: string };

function currentMonthLabel(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

function monthBounds(): { startDate: string; endDate: string; payDate: string } {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), 1);
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  const pay = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  const fmt = (d: Date) => d.toISOString().slice(0, 10);
  return { startDate: fmt(start), endDate: fmt(end), payDate: fmt(pay) };
}

export function PayrollDashboard() {
  const [periods, setPeriods] = useState<PayrollPeriod[]>([]);
  const [selectedPeriodId, setSelectedPeriodId] = useState<string>('');
  const [latestRun, setLatestRun] = useState<PayrollRun | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const loadPeriods = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/payroll/periods');
      const json = (await res.json()) as ApiEnvelope<PayrollPeriod[]>;
      if (!res.ok) {
        throw new Error(json.message ?? json.error ?? 'Failed to load periods');
      }
      const list = json.data ?? [];
      setPeriods(list);
      if (!selectedPeriodId && list[0]) {
        setSelectedPeriodId(list[0].id);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load payroll periods');
    } finally {
      setLoading(false);
    }
  }, [selectedPeriodId]);

  useEffect(() => {
    void loadPeriods();
  }, [loadPeriods]);

  async function handleCreatePeriod() {
    setBusy(true);
    setError(null);
    setMessage(null);
    const bounds = monthBounds();
    try {
      const res = await fetch('/api/payroll/periods', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          periodLabel: currentMonthLabel(),
          ...bounds,
        }),
      });
      const json = (await res.json()) as ApiEnvelope<PayrollPeriod>;
      if (!res.ok) {
        throw new Error(json.message ?? json.error ?? 'Failed to create period');
      }
      setMessage(`Period ${json.data?.periodLabel ?? ''} created.`);
      await loadPeriods();
      if (json.data?.id) {
        setSelectedPeriodId(json.data.id);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to create period');
    } finally {
      setBusy(false);
    }
  }

  async function handleCreateRun() {
    if (!selectedPeriodId) {
      setError('Select a payroll period first.');
      return;
    }
    setBusy(true);
    setError(null);
    setMessage(null);
    try {
      const res = await fetch('/api/payroll/runs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ periodId: selectedPeriodId }),
      });
      const json = (await res.json()) as ApiEnvelope<{ run: PayrollRun }>;
      if (!res.ok) {
        throw new Error(json.message ?? json.error ?? 'Failed to create payroll run');
      }
      setLatestRun(json.data?.run ?? null);
      setMessage(`Draft run #${json.data?.run.runNumber ?? ''} computed.`);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to create payroll run');
    } finally {
      setBusy(false);
    }
  }

  async function handleApproveRun() {
    if (!latestRun?.id) {
      setError('Create and compute a run before approving.');
      return;
    }
    setBusy(true);
    setError(null);
    setMessage(null);
    try {
      const res = await fetch(`/api/payroll/runs/${latestRun.id}/approve`, {
        method: 'POST',
      });
      const json = (await res.json()) as ApiEnvelope<{ run: PayrollRun }>;
      if (!res.ok) {
        throw new Error(json.message ?? json.error ?? 'Failed to approve run');
      }
      setLatestRun(json.data?.run ?? latestRun);
      setMessage('Payroll run approved — payslips issued.');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to approve payroll run');
    } finally {
      setBusy(false);
    }
  }

  function downloadExport(path: 'paye' | 'ssc') {
    if (!selectedPeriodId) {
      setError('Select a period to export.');
      return;
    }
    window.location.href = `/api/payroll/exports/${path}?periodId=${encodeURIComponent(selectedPeriodId)}`;
  }

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold text-base-content">Namibia payroll</h2>
            <p className="text-sm text-base-content/70 mt-1">
              {PAYE_FY_LABEL} PAYE brackets · SSC 0.9% + 0.9% (cap N$11,000) · Employer ref{' '}
              <span className="font-mono">{NAMIBIA_PAYROLL_EMPLOYER_REF}</span>
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              className="rounded-full px-6"
              disabled={busy}
              onClick={() => void handleCreatePeriod()}
            >
              New period
            </Button>
            <Button
              className="rounded-full px-6"
              disabled={busy || !selectedPeriodId}
              isLoading={busy}
              onClick={() => void handleCreateRun()}
            >
              Create draft run
            </Button>
          </div>
        </div>
      </Card>

      {error && (
        <div className="alert alert-error" role="alert">
          <span>{error}</span>
        </div>
      )}
      {message && (
        <div className="alert alert-success" role="status">
          <span>{message}</span>
        </div>
      )}

      <Card className="p-6">
        <h3 className="text-base font-semibold mb-4">Payroll periods</h3>
        {loading ? (
          <div className="space-y-2">
            <div className="skeleton h-4 w-full" />
            <div className="skeleton h-4 w-5/6" />
          </div>
        ) : periods.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-base-content/70 mb-4">No payroll periods yet.</p>
            <Button className="rounded-full px-6" onClick={() => void handleCreatePeriod()}>
              Create first period
            </Button>
          </div>
        ) : (
          <div className="overflow-x-auto table-scroll">
            <table className="table table-zebra">
              <thead>
                <tr>
                  <th>Select</th>
                  <th>Period</th>
                  <th>Start</th>
                  <th>End</th>
                  <th>Pay date</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {periods.map((period) => (
                  <tr key={period.id}>
                    <td>
                      <input
                        type="radio"
                        name="payroll-period"
                        className="radio radio-primary"
                        checked={selectedPeriodId === period.id}
                        onChange={() => setSelectedPeriodId(period.id)}
                        aria-label={`Select period ${period.periodLabel}`}
                      />
                    </td>
                    <td className="font-medium">{period.periodLabel}</td>
                    <td>{period.startDate}</td>
                    <td>{period.endDate}</td>
                    <td>{period.payDate}</td>
                    <td>
                      <span className="badge badge-soft badge-primary">{period.status}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {latestRun && (
        <Card className="p-6">
          <h3 className="text-base font-semibold mb-2">Latest run</h3>
          <dl className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm mb-4">
            <div>
              <dt className="text-base-content/60">Run #</dt>
              <dd className="font-semibold">{latestRun.runNumber}</dd>
            </div>
            <div>
              <dt className="text-base-content/60">Status</dt>
              <dd>
                <span className="badge badge-soft">{latestRun.status}</span>
              </dd>
            </div>
            <div>
              <dt className="text-base-content/60">Gross</dt>
              <dd className="font-mono">NAD {latestRun.totalGross.toFixed(2)}</dd>
            </div>
            <div>
              <dt className="text-base-content/60">Net</dt>
              <dd className="font-mono">NAD {latestRun.totalNet.toFixed(2)}</dd>
            </div>
          </dl>
          <div className="flex flex-wrap gap-2">
            <Button
              className="rounded-full px-6"
              disabled={busy || latestRun.status === 'approved'}
              onClick={() => void handleApproveRun()}
            >
              Approve run
            </Button>
            <Button
              variant="outline"
              className="rounded-full px-6"
              disabled={!selectedPeriodId}
              onClick={() => downloadExport('paye')}
            >
              Export PAYE CSV
            </Button>
            <Button
              variant="outline"
              className="rounded-full px-6"
              disabled={!selectedPeriodId}
              onClick={() => downloadExport('ssc')}
            >
              Export SSC CSV
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
}
