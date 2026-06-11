/**
 * GlPeriodCloseCard
 *
 * Purpose: Fiscal period close UI with draft folio charge guard (OSS W4 / dubbl pattern).
 * Location: /components/features/accounting/GlPeriodCloseCard.tsx
 */

'use client';

import { useCallback, useEffect, useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';

type PeriodLock = {
  lockDate: string;
  lockedAt: string;
  reason: string;
};

type GlPeriodCloseCardProps = {
  propertyId: string | null;
  periodEnd: string;
  onClosed?: () => void;
};

export function GlPeriodCloseCard({ propertyId, periodEnd, onClosed }: GlPeriodCloseCardProps) {
  const [draftCount, setDraftCount] = useState(0);
  const [lock, setLock] = useState<PeriodLock | null>(null);
  const [loading, setLoading] = useState(false);
  const [closing, setClosing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const loadStatus = useCallback(async () => {
    if (!propertyId) return;
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        propertyId,
        periodEnd: new Date(`${periodEnd}T23:59:59.999Z`).toISOString(),
      });
      const res = await fetch(`/api/reports/accounting/period-close?${params}`, {
        credentials: 'include',
      });
      const json = await res.json();
      if (!res.ok) {
        throw new Error(json?.error?.message || 'Failed to load period status');
      }
      setDraftCount(json.data?.draftChargeCount ?? 0);
      setLock(json.data?.lock ?? null);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load period status');
    } finally {
      setLoading(false);
    }
  }, [propertyId, periodEnd]);

  useEffect(() => {
    void loadStatus();
  }, [loadStatus]);

  const handleClose = async () => {
    if (!propertyId) return;
    setClosing(true);
    setError(null);
    setSuccess(null);
    try {
      const res = await fetch('/api/reports/accounting/period-close', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          propertyId,
          periodEnd: new Date(`${periodEnd}T23:59:59.999Z`).toISOString(),
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        throw new Error(json?.error?.message || 'Period close failed');
      }
      setSuccess(`Period closed through ${json.data?.lockDate ?? periodEnd}`);
      await loadStatus();
      onClosed?.();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Period close failed');
    } finally {
      setClosing(false);
    }
  };

  const isLockedThrough =
    lock != null && lock.lockDate >= periodEnd;

  return (
    <Card className="p-6 space-y-4">
      <div>
        <h2 className="text-lg font-semibold text-nude-900">GL period close</h2>
        <p className="text-sm text-nude-600 mt-1">
          Lock the general ledger through <strong>{periodEnd}</strong> after all folio charges are
          settled. Open folio lines block close (draft-entry guard).
        </p>
      </div>

      {!propertyId && (
        <div className="alert alert-warning">
          <span>Select a property to close the accounting period.</span>
        </div>
      )}

      {loading && <p className="text-sm text-nude-500">Checking period status…</p>}

      {draftCount > 0 && (
        <div className="alert alert-warning" role="status">
          <span>
            <strong>{draftCount}</strong> unsettled folio{' '}
            {draftCount === 1 ? 'charge' : 'charges'} in this period. Settle or void them before
            closing.
          </span>
        </div>
      )}

      {isLockedThrough && (
        <div className="alert alert-success" role="status">
          <span>
            Period locked through {lock.lockDate} ({lock.reason}).
          </span>
        </div>
      )}

      {error && (
        <div className="alert alert-error" role="alert">
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="alert alert-success" role="status">
          <span>{success}</span>
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        <Button
          variant="primary"
          onClick={() => void handleClose()}
          disabled={
            !propertyId || closing || loading || draftCount > 0 || isLockedThrough
          }
          isLoading={closing}
        >
          Close period
        </Button>
        <Button variant="outline" size="sm" onClick={() => void loadStatus()} disabled={loading}>
          Refresh status
        </Button>
      </div>
    </Card>
  );
}
