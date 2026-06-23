/**
 * Payment Disputes Dashboard Page
 *
 * Purpose: Desk view to review card chargebacks / refunds / reversals and resolve them.
 * Location: app/(dashboard)/payments/disputes/page.tsx
 *
 * Features: list disputes (status filter), see folio impact, resolve (won/lost/refunded/reversed).
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';

interface Dispute {
  id: string;
  kind: 'chargeback' | 'refund' | 'reversal';
  status: string;
  amount: string;
  currency: string;
  merchantReference: string | null;
  gatewayTransactionId: string | null;
  reasonCode: string | null;
  reason: string | null;
  bookingId: string | null;
  openedAt: string | null;
  resolvedAt: string | null;
}

const STATUS_FILTERS = ['', 'opened', 'under_review', 'won', 'lost', 'refunded', 'reversed'] as const;
const RESOLUTIONS = ['under_review', 'won', 'lost', 'refunded', 'reversed'] as const;

function statusBadgeClass(status: string): string {
  switch (status) {
    case 'opened':
      return 'badge-warning';
    case 'under_review':
      return 'badge-info';
    case 'won':
    case 'refunded':
      return 'badge-success';
    case 'lost':
    case 'reversed':
      return 'badge-error';
    default:
      return 'badge-ghost';
  }
}

export default function PaymentDisputesPage() {
  const [disputes, setDisputes] = useState<Dispute[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [savingId, setSavingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const qs = statusFilter ? `?status=${statusFilter}` : '';
      const res = await fetch(`/api/payments/disputes${qs}`);
      if (!res.ok) throw new Error('Failed to load disputes');
      const data = await res.json();
      setDisputes(data.disputes ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load disputes');
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    void load();
  }, [load]);

  const resolve = async (id: string, status: string) => {
    setSavingId(id);
    try {
      const res = await fetch(`/api/payments/disputes/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error('Failed to update dispute');
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update dispute');
    } finally {
      setSavingId(null);
    }
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-ink-900">Payment Disputes</h1>
          <p className="text-sm text-ink-600">
            Card chargebacks, refunds and reversals. Opening a dispute reverses the folio.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <select
            className="select select-bordered select-sm rounded-full"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            aria-label="Filter by status"
          >
            {STATUS_FILTERS.map((s) => (
              <option key={s || 'all'} value={s}>
                {s ? s.replace('_', ' ') : 'All statuses'}
              </option>
            ))}
          </select>
          <Button variant="outline" size="sm" onClick={() => void load()} className="rounded-full px-6">
            Refresh
          </Button>
        </div>
      </div>

      {error && (
        <div className="alert alert-error rounded-etuna-card">
          <span>{error}</span>
        </div>
      )}

      {loading ? (
        <Card className="p-10 text-center text-ink-500">Loading disputes…</Card>
      ) : disputes.length === 0 ? (
        <Card className="p-10 text-center text-ink-500">
          No disputes{statusFilter ? ` with status “${statusFilter}”` : ''}. Chargebacks reported by
          Adumo or your bank will appear here.
        </Card>
      ) : (
        <Card className="overflow-x-auto p-0">
          <table className="table">
            <thead>
              <tr>
                <th>Opened</th>
                <th>Kind</th>
                <th>Amount</th>
                <th>Reference</th>
                <th>Reason</th>
                <th>Status</th>
                <th>Resolve</th>
              </tr>
            </thead>
            <tbody>
              {disputes.map((d) => (
                <tr key={d.id}>
                  <td className="whitespace-nowrap text-sm">
                    {d.openedAt ? new Date(d.openedAt).toLocaleDateString() : '—'}
                  </td>
                  <td className="capitalize">{d.kind}</td>
                  <td className="whitespace-nowrap font-medium">
                    {d.currency} {Number.parseFloat(d.amount).toFixed(2)}
                  </td>
                  <td className="font-mono text-xs">{d.merchantReference ?? '—'}</td>
                  <td className="max-w-[16rem] truncate text-sm" title={d.reason ?? ''}>
                    {d.reasonCode ?? d.reason ?? '—'}
                  </td>
                  <td>
                    <span className={`badge ${statusBadgeClass(d.status)} badge-sm capitalize`}>
                      {d.status.replace('_', ' ')}
                    </span>
                  </td>
                  <td>
                    {['opened', 'under_review'].includes(d.status) ? (
                      <select
                        className="select select-bordered select-xs rounded-full"
                        disabled={savingId === d.id}
                        defaultValue=""
                        onChange={(e) => e.target.value && resolve(d.id, e.target.value)}
                        aria-label="Resolve dispute"
                      >
                        <option value="" disabled>
                          {savingId === d.id ? 'Saving…' : 'Set status…'}
                        </option>
                        {RESOLUTIONS.map((r) => (
                          <option key={r} value={r}>
                            {r.replace('_', ' ')}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <span className="text-xs text-nude-400">
                        {d.resolvedAt ? new Date(d.resolvedAt).toLocaleDateString() : 'resolved'}
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}
    </div>
  );
}
