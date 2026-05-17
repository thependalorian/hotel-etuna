/**
 * NamQrPendingQueue — staff approval list for guest-submitted NamQR payments (Option B).
 * Location: components/features/payments/NamQrPendingQueue.tsx
 */

'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';

type PendingItem = {
  id: string;
  bookingId: string;
  bookingReference: string | null;
  amountClaimed: number;
  bankReference: string;
  qrReference: string | null;
  createdAt?: string;
};

export function NamQrPendingQueue() {
  const [items, setItems] = useState<PendingItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/payments/namqr/pending?status=pending');
      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error?.message ?? 'Failed to load queue');
      }
      setItems(json.data?.items ?? []);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function approve(id: string) {
    setBusyId(id);
    setError(null);
    try {
      const res = await fetch(`/api/payments/namqr/pending/${id}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });
      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error?.message ?? 'Approve failed');
      }
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Approve failed');
    } finally {
      setBusyId(null);
    }
  }

  async function reject(id: string) {
    const reason = window.prompt('Reason for rejection (optional):') ?? undefined;
    setBusyId(id);
    setError(null);
    try {
      const res = await fetch(`/api/payments/namqr/pending/${id}/reject`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason }),
      });
      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error?.message ?? 'Reject failed');
      }
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Reject failed');
    } finally {
      setBusyId(null);
    }
  }

  if (loading) {
    return <p className="text-sm text-base-content/60">Loading guest NamQR queue…</p>;
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm text-base-content/70">
          Guests who paid via banking app and submitted a reference. Match against Nedbank
          statement, then approve.
        </p>
        <button type="button" className="btn btn-ghost btn-xs" onClick={() => void load()}>
          Refresh
        </button>
      </div>
      {error && <div className="alert alert-error text-sm">{error}</div>}
      {items.length === 0 ? (
        <p className="text-sm text-success">No pending guest NamQR payments.</p>
      ) : (
        <ul className="space-y-3">
          {items.map((item) => (
            <li
              key={item.id}
              className="rounded-lg border border-base-300 bg-base-200/50 p-3 text-sm space-y-2"
            >
              <div className="flex flex-wrap justify-between gap-2">
                <span className="font-mono font-semibold">
                  {item.bookingReference ?? item.bookingId.slice(0, 8)}
                </span>
                <span>NAD {item.amountClaimed.toFixed(2)}</span>
              </div>
              <p>
                Bank ref: <span className="font-mono">{item.bankReference}</span>
                {item.qrReference ? (
                  <>
                    {' '}
                    · QR ref: <span className="font-mono">{item.qrReference}</span>
                  </>
                ) : null}
              </p>
              {item.createdAt && (
                <p className="text-xs text-base-content/60">
                  Submitted {new Date(item.createdAt).toLocaleString()}
                </p>
              )}
              <div className="flex flex-wrap gap-2">
                <Button
                  size="sm"
                  disabled={busyId === item.id}
                  onClick={() => void approve(item.id)}
                >
                  Approve on folio
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={busyId === item.id}
                  onClick={() => void reject(item.id)}
                >
                  Reject
                </Button>
                <Link
                  href={`/bookings/${item.bookingId}`}
                  className="btn btn-ghost btn-sm"
                >
                  Open booking
                </Link>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
