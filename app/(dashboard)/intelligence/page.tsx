/**
 * Intelligence — approval-gated recommendation review.
 * Location: /app/(dashboard)/intelligence/page.tsx
 *
 * Surfaces forecast-driven rate suggestions and low-stock reorder suggestions. Admin/front-desk
 * approve or reject each one — nothing changes a room rate or places an order until approved.
 */

'use client';

import { useCallback, useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { Lightbulb, TrendingUp, Package, Check, X, RefreshCw, Wrench } from 'lucide-react';
import LoadingSpinner from '@/components/shared/LoadingSpinner';
import EmptyState from '@/components/shared/EmptyState';
import { apiUrl } from '@/lib/utils/api-url';
import { securityLogger } from '@/lib/utils/security-logger.client';
import { formatCurrencyNAD } from '@/lib/formatters';

interface RateRec {
  id: string;
  roomType: string;
  currentRate: string;
  recommendedRate: string;
  forecastOccupancy: string | null;
  horizonDays: number;
  rationale: string | null;
}

interface ReorderRec {
  id: string;
  inventoryItemId: string;
  quantityOnHand: string;
  reorderPoint: string;
  recommendedQuantity: string;
  rationale: string | null;
}

interface MaintenanceFlag {
  roomId: string;
  roomNumber: string | null;
  roomType: string | null;
  issueCount: number;
  openCount: number;
  categories: string[];
  severity: 'watch' | 'inspect';
}

export default function IntelligencePage() {
  const { data: session } = useSession();
  const [rates, setRates] = useState<RateRec[]>([]);
  const [reorders, setReorders] = useState<ReorderRec[]>([]);
  const [maintenance, setMaintenance] = useState<MaintenanceFlag[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const [rRes, oRes, mRes] = await Promise.all([
        fetch(apiUrl('/api/intelligence/rate-recommendations?status=pending')),
        fetch(apiUrl('/api/intelligence/reorder-recommendations?status=pending')),
        fetch(apiUrl('/api/intelligence/maintenance-insights')),
      ]);
      if (rRes.ok) setRates((await rRes.json()).data ?? []);
      if (oRes.ok) setReorders((await oRes.json()).data ?? []);
      if (mRes.ok) setMaintenance((await mRes.json()).data ?? []);
    } catch (error) {
      securityLogger.error('[IntelligencePage] load failed:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (session?.user) load();
    else setLoading(false);
  }, [session, load]);

  const generate = async () => {
    setBusyId('generate');
    try {
      await Promise.all([
        fetch(apiUrl('/api/intelligence/rate-recommendations'), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ horizonDays: 30 }),
        }),
        fetch(apiUrl('/api/intelligence/reorder-recommendations'), { method: 'POST' }),
      ]);
      await load();
    } catch (error) {
      securityLogger.error('[IntelligencePage] generate failed:', error);
    } finally {
      setBusyId(null);
    }
  };

  const decide = async (
    kind: 'rate' | 'reorder',
    id: string,
    action: 'approve' | 'reject',
  ) => {
    setBusyId(id);
    try {
      const path =
        kind === 'rate'
          ? `/api/intelligence/rate-recommendations/${id}`
          : `/api/intelligence/reorder-recommendations/${id}`;
      const res = await fetch(apiUrl(path), {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      });
      if (res.ok) {
        if (kind === 'rate') setRates((prev) => prev.filter((r) => r.id !== id));
        else setReorders((prev) => prev.filter((r) => r.id !== id));
      }
    } catch (error) {
      securityLogger.error('[IntelligencePage] decision failed:', error);
    } finally {
      setBusyId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <LoadingSpinner size="lg" text="Loading recommendations..." />
      </div>
    );
  }

  const empty = rates.length === 0 && reorders.length === 0 && maintenance.length === 0;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="etuna-page-title mb-2">Intelligence</h1>
          <p className="text-ink-600">
            Forecast-driven suggestions. Nothing changes a rate or places an order until you approve it.
          </p>
        </div>
        <button
          className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full bg-ci-primary text-ci-cream font-bold hover:bg-ci-primary/90 transition-colors min-h-[44px] disabled:opacity-60"
          onClick={generate}
          disabled={busyId === 'generate'}
        >
          <RefreshCw className={`w-4 h-4 ${busyId === 'generate' ? 'animate-spin' : ''}`} />
          Refresh recommendations
        </button>
      </div>

      {empty ? (
        <EmptyState
          icon={Lightbulb}
          title="No recommendations pending"
          description="Run “Refresh recommendations” to generate suggestions from the latest forecast and stock levels."
        />
      ) : (
        <>
          {/* Rate recommendations */}
          <section className="space-y-3">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-ci-primary" />
              <h2 className="text-lg font-bold text-ink-900">Rate recommendations</h2>
              <span className="text-sm text-ink-500">({rates.length})</span>
            </div>
            {rates.length === 0 ? (
              <p className="text-sm text-ink-500">No pending rate suggestions.</p>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {rates.map((r) => {
                  const current = Number(r.currentRate);
                  const recommended = Number(r.recommendedRate);
                  const up = recommended >= current;
                  return (
                    <div key={r.id} className="rounded-etuna-card border border-nude-200 bg-white p-5">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="font-bold text-ink-900">{r.roomType}</p>
                          <p className="text-sm text-ink-600">
                            {formatCurrencyNAD(current)} →{' '}
                            <span className={up ? 'text-success font-bold' : 'text-error font-bold'}>
                              {formatCurrencyNAD(recommended)}
                            </span>
                          </p>
                        </div>
                        {r.forecastOccupancy != null && (
                          <span className="text-xs px-3 py-1 rounded-full bg-nude-100 text-ink-700">
                            {Number(r.forecastOccupancy).toFixed(0)}% occ · {r.horizonDays}d
                          </span>
                        )}
                      </div>
                      {r.rationale && <p className="text-sm text-ink-600 mt-3">{r.rationale}</p>}
                      <div className="flex gap-2 mt-4">
                        <button
                          className="inline-flex items-center gap-1.5 px-5 py-2 rounded-full bg-ci-primary text-ci-cream text-sm font-bold hover:bg-ci-primary/90 disabled:opacity-60"
                          onClick={() => decide('rate', r.id, 'approve')}
                          disabled={busyId === r.id}
                        >
                          <Check className="w-4 h-4" /> Approve
                        </button>
                        <button
                          className="inline-flex items-center gap-1.5 px-5 py-2 rounded-full border border-nude-200 text-ink-800 text-sm font-medium hover:bg-nude-50 disabled:opacity-60"
                          onClick={() => decide('rate', r.id, 'reject')}
                          disabled={busyId === r.id}
                        >
                          <X className="w-4 h-4" /> Reject
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>

          {/* Reorder recommendations */}
          <section className="space-y-3">
            <div className="flex items-center gap-2">
              <Package className="w-5 h-5 text-ci-primary" />
              <h2 className="text-lg font-bold text-ink-900">Reorder recommendations</h2>
              <span className="text-sm text-ink-500">({reorders.length})</span>
            </div>
            {reorders.length === 0 ? (
              <p className="text-sm text-ink-500">No pending reorder suggestions.</p>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {reorders.map((r) => (
                  <div key={r.id} className="rounded-etuna-card border border-nude-200 bg-white p-5">
                    {r.rationale && <p className="text-sm text-ink-700">{r.rationale}</p>}
                    <p className="text-xs text-ink-500 mt-2">
                      On hand {Number(r.quantityOnHand)} · reorder point {Number(r.reorderPoint)} · suggest{' '}
                      {Number(r.recommendedQuantity)}
                    </p>
                    <div className="flex gap-2 mt-4">
                      <button
                        className="inline-flex items-center gap-1.5 px-5 py-2 rounded-full bg-ci-primary text-ci-cream text-sm font-bold hover:bg-ci-primary/90 disabled:opacity-60"
                        onClick={() => decide('reorder', r.id, 'approve')}
                        disabled={busyId === r.id}
                      >
                        <Check className="w-4 h-4" /> Approve order
                      </button>
                      <button
                        className="inline-flex items-center gap-1.5 px-5 py-2 rounded-full border border-nude-200 text-ink-800 text-sm font-medium hover:bg-nude-50 disabled:opacity-60"
                        onClick={() => decide('reorder', r.id, 'reject')}
                        disabled={busyId === r.id}
                      >
                        <X className="w-4 h-4" /> Reject
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Predictive maintenance */}
          <section className="space-y-3">
            <div className="flex items-center gap-2">
              <Wrench className="w-5 h-5 text-ci-primary" />
              <h2 className="text-lg font-bold text-ink-900">Maintenance to inspect</h2>
              <span className="text-sm text-ink-500">({maintenance.length})</span>
            </div>
            {maintenance.length === 0 ? (
              <p className="text-sm text-ink-500">No rooms with recurring maintenance issues.</p>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {maintenance.map((m) => (
                  <div key={m.roomId} className="rounded-etuna-card border border-nude-200 bg-white p-5">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-bold text-ink-900">
                          Room {m.roomNumber ?? '—'}
                          {m.roomType ? <span className="text-ink-500 font-normal"> · {m.roomType}</span> : null}
                        </p>
                        <p className="text-sm text-ink-600">
                          {m.issueCount} maintenance reports · {m.openCount} still open
                        </p>
                      </div>
                      <span
                        className={`text-xs px-3 py-1 rounded-full font-semibold ${
                          m.severity === 'inspect'
                            ? 'bg-error/10 text-error'
                            : 'bg-warning/10 text-warning'
                        }`}
                      >
                        {m.severity === 'inspect' ? 'Inspect' : 'Watch'}
                      </span>
                    </div>
                    {m.categories.length > 0 && (
                      <p className="text-xs text-ink-500 mt-2">Recurring: {m.categories.join(', ')}</p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </section>
        </>
      )}
    </div>
  );
}
