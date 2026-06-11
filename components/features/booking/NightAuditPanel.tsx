/**
 * NightAuditPanel — run end-of-day audit and show revenue summary.
 *
 * Purpose: Staff UI for night audit (tariffs, no-shows, stayovers, KPIs).
 * Location: /components/features/booking/NightAuditPanel.tsx
 */

'use client';

import { useCallback, useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import type { NightAuditResult } from '@/lib/services/booking/NightAuditService';

type NightAuditPanelProps = {
  propertyId: string;
};

function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

export function NightAuditPanel({ propertyId }: NightAuditPanelProps) {
  const [businessDate, setBusinessDate] = useState(todayIso());
  const [result, setResult] = useState<NightAuditResult | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const runAudit = useCallback(async () => {
    setBusy(true);
    setError(null);
    setMessage(null);
    try {
      const res = await fetch('/api/bookings/night-audit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ propertyId, businessDate }),
      });
      const json = await res.json();
      if (!res.ok) {
        throw new Error(json?.error?.message || 'Night audit failed');
      }
      setResult(json.data as NightAuditResult);
      setMessage('Night audit completed');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Night audit failed');
    } finally {
      setBusy(false);
    }
  }, [propertyId, businessDate]);

  const rev = result?.revenueSummary;

  return (
    <Card variant="elevated" className="p-6">
      <h2 className="font-display text-xl font-semibold text-nude-900 mb-1">Night audit</h2>
      <p className="text-sm text-nude-600 mb-4">
        Post room tariffs, process no-shows, advance stayovers, and generate revenue KPIs for the
        business date.
      </p>

      <div className="flex flex-wrap items-end gap-3 mb-4">
        <label className="form-control w-full sm:w-auto">
          <span className="label-text text-sm">Business date</span>
          <input
            type="date"
            className="input input-bordered"
            value={businessDate}
            onChange={(e) => setBusinessDate(e.target.value)}
          />
        </label>
        <Button
          className="rounded-full px-6"
          onClick={() => void runAudit()}
          isLoading={busy}
          disabled={busy || !propertyId}
        >
          Run night audit
        </Button>
      </div>

      {error && (
        <div className="alert alert-error mb-4" role="alert">
          <span>{error}</span>
        </div>
      )}
      {message && (
        <div className="alert alert-success mb-4" role="status">
          <span>{message}</span>
        </div>
      )}

      {result && rev && (
        <div className="space-y-4">
          <div className="stats stats-vertical sm:stats-horizontal shadow w-full bg-nude-50">
            <div className="stat">
              <div className="stat-title">Room revenue</div>
              <div className="stat-value text-lg">NAD {rev.roomRevenue.toFixed(2)}</div>
            </div>
            <div className="stat">
              <div className="stat-title">ADR</div>
              <div className="stat-value text-lg">NAD {rev.adr.toFixed(2)}</div>
            </div>
            <div className="stat">
              <div className="stat-title">RevPAR</div>
              <div className="stat-value text-lg">NAD {rev.revpar.toFixed(2)}</div>
            </div>
            <div className="stat">
              <div className="stat-title">Occupancy</div>
              <div className="stat-value text-lg">{(rev.occupancyRate * 100).toFixed(1)}%</div>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
            <div className="rounded-lg border border-nude-200 p-3">
              <p className="text-nude-600">Tariffs posted</p>
              <p className="font-semibold">{result.tariffResult.count}</p>
            </div>
            <div className="rounded-lg border border-nude-200 p-3">
              <p className="text-nude-600">No-shows</p>
              <p className="font-semibold">{result.noShowResult.count}</p>
            </div>
            <div className="rounded-lg border border-nude-200 p-3">
              <p className="text-nude-600">Stayovers</p>
              <p className="font-semibold">{result.stayoverResult.advanced}</p>
            </div>
            <div className="rounded-lg border border-nude-200 p-3">
              <p className="text-nude-600">Due-outs</p>
              <p className="font-semibold">{result.dueOutResult.markedDueOut}</p>
            </div>
          </div>

          {result.errors.length > 0 && (
            <div className="alert alert-warning" role="status">
              <span>
                {result.errors.length} warning(s) during audit — review folio lines manually.
              </span>
            </div>
          )}
        </div>
      )}
    </Card>
  );
}
