/**
 * AvailabilityLedgerPanel — staff view/edit stop-sell per business date (OSS W6)
 *
 * Purpose: Dashboard UI for daily availability ledger restrictions.
 * Location: /components/features/property/AvailabilityLedgerPanel.tsx
 */

'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { useActiveProperty } from '@/components/providers/ActivePropertyProvider';
import { apiUrl } from '@/lib/utils/api-url';

type LedgerRow = {
  id: string;
  roomId: string;
  businessDate: string;
  stopSell: boolean;
  outOfOrder: boolean;
  blocked: number;
  sold: number;
  cta: boolean;
  ctd: boolean;
};

function addDays(isoDate: string, days: number): string {
  const d = new Date(isoDate);
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

export function AvailabilityLedgerPanel() {
  const { activePropertyId, activeProperty, loading: propertyLoading } = useActiveProperty();
  const [startDate, setStartDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [endDate, setEndDate] = useState(() => addDays(new Date().toISOString().slice(0, 10), 14));
  const [rows, setRows] = useState<LedgerRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [savingDate, setSavingDate] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const dates = useMemo(() => {
    const list: string[] = [];
    let cursor = startDate;
    while (cursor < endDate) {
      list.push(cursor);
      cursor = addDays(cursor, 1);
    }
    return list;
  }, [startDate, endDate]);

  const stopSellByDate = useMemo(() => {
    const map = new Map<string, boolean>();
    for (const row of rows) {
      if (row.stopSell) {
        map.set(row.businessDate, true);
      }
    }
    return map;
  }, [rows]);

  const fetchLedger = useCallback(async () => {
    if (!activePropertyId) return;
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        propertyId: activePropertyId,
        startDate,
        endDate,
      });
      const res = await fetch(apiUrl(`/api/properties/availability-ledger?${params}`), {
        credentials: 'include',
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        const msg =
          json?.error?.message ?? json?.message ?? json?.error ?? 'Failed to load ledger';
        throw new Error(typeof msg === 'string' ? msg : 'Failed to load ledger');
      }
      const data = (json?.data ?? json) as { entries?: LedgerRow[] };
      setRows(Array.isArray(data.entries) ? data.entries : []);
    } catch (e) {
      setRows([]);
      setError(e instanceof Error ? e.message : 'Failed to load ledger');
    } finally {
      setLoading(false);
    }
  }, [activePropertyId, startDate, endDate]);

  useEffect(() => {
    if (!propertyLoading && activePropertyId) {
      void fetchLedger();
    }
  }, [fetchLedger, propertyLoading, activePropertyId]);

  const toggleStopSell = useCallback(
    async (businessDate: string, next: boolean) => {
      if (!activePropertyId) return;
      setSavingDate(businessDate);
      setError(null);
      try {
        const res = await fetch(apiUrl('/api/properties/availability-ledger'), {
          method: 'PATCH',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            propertyId: activePropertyId,
            businessDate,
            stopSell: next,
          }),
        });
        const json = await res.json().catch(() => ({}));
        if (!res.ok) {
          const msg =
            json?.error?.message ?? json?.message ?? json?.error ?? 'Failed to update stop-sell';
          throw new Error(typeof msg === 'string' ? msg : 'Failed to update stop-sell');
        }
        await fetchLedger();
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Failed to update stop-sell');
      } finally {
        setSavingDate(null);
      }
    },
    [activePropertyId, fetchLedger]
  );

  if (propertyLoading) {
    return (
      <Card className="p-6 space-y-4">
        <div className="skeleton h-8 w-48" />
        <div className="skeleton h-32 w-full" />
      </Card>
    );
  }

  if (!activePropertyId) {
    return (
      <Card className="p-6">
        <p className="text-nude-600">Select a property to manage availability restrictions.</p>
      </Card>
    );
  }

  return (
    <Card className="p-6 space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-nude-900">Availability ledger</h2>
          <p className="text-sm text-nude-600 mt-1">
            Stop-sell applies property-wide for{' '}
            <span className="font-medium">{activeProperty?.name}</span>. Bookings still reduce
            sellable inventory; ledger flags block new sales.
          </p>
        </div>
        <Button
          variant="outline"
          className="rounded-full px-6"
          onClick={() => void fetchLedger()}
          disabled={loading}
        >
          {loading ? 'Refreshing…' : 'Refresh'}
        </Button>
      </div>

      <div className="flex flex-wrap gap-4 items-end">
        <label className="form-control w-full max-w-xs">
          <span className="label-text font-medium">From</span>
          <input
            type="date"
            className="input input-bordered rounded-full min-h-[44px]"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
          />
        </label>
        <label className="form-control w-full max-w-xs">
          <span className="label-text font-medium">To (exclusive)</span>
          <input
            type="date"
            className="input input-bordered rounded-full min-h-[44px]"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
          />
        </label>
      </div>

      {error && (
        <div className="alert alert-error" role="alert">
          <span>{error}</span>
        </div>
      )}

      <div className="overflow-x-auto table-scroll">
        <table className="table table-zebra">
          <thead>
            <tr>
              <th>Business date</th>
              <th>Stop-sell (all rooms)</th>
              <th>Ledger rows</th>
            </tr>
          </thead>
          <tbody>
            {dates.map((date) => {
              const rowCount = rows.filter((r) => r.businessDate === date).length;
              const stopSell = stopSellByDate.get(date) ?? false;
              const busy = savingDate === date;
              return (
                <tr key={date}>
                  <td className="font-medium">{date}</td>
                  <td>
                    <input
                      type="checkbox"
                      className="toggle toggle-primary"
                      checked={stopSell}
                      disabled={busy || loading}
                      aria-label={`Stop-sell on ${date}`}
                      onChange={(e) => void toggleStopSell(date, e.target.checked)}
                    />
                  </td>
                  <td className="text-sm text-nude-600">
                    {rowCount > 0 ? `${rowCount} room bucket(s)` : '—'}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {dates.length === 0 && (
        <p className="text-sm text-nude-600">Choose a valid date range to edit stop-sell.</p>
      )}
    </Card>
  );
}
