/**
 * NamQrPendingQueue — staff approval list for guest-submitted NamQR payments (Option B).
 * Location: components/features/payments/NamQrPendingQueue.tsx
 */

'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import EmptyState from '@/components/shared/EmptyState';
import { Inbox } from 'lucide-react';

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
  const [rejectTargetId, setRejectTargetId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const rejectDialogRef = useRef<HTMLDialogElement>(null);

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

  useEffect(() => {
    const dialog = rejectDialogRef.current;
    if (!dialog) return;
    if (rejectTargetId) {
      if (!dialog.open) dialog.showModal();
    } else if (dialog.open) {
      dialog.close();
    }
  }, [rejectTargetId]);

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

  function openRejectDialog(id: string) {
    setRejectReason('');
    setRejectTargetId(id);
  }

  function closeRejectDialog() {
    setRejectTargetId(null);
    setRejectReason('');
  }

  async function confirmReject() {
    const id = rejectTargetId;
    if (!id) return;

    setBusyId(id);
    setError(null);
    closeRejectDialog();

    try {
      const res = await fetch(`/api/payments/namqr/pending/${id}/reject`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reason: rejectReason.trim() || undefined,
        }),
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
    return (
      <div className="space-y-2" aria-busy="true" role="status">
        <p className="sr-only">Loading guest NamQR queue…</p>
        <div className="skeleton h-4 w-full" aria-hidden />
        <div className="skeleton h-16 w-full" aria-hidden />
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm text-base-content/70">
          Guests who paid via banking app and submitted a reference. Match against Nedbank
          statement, then post to folio.
        </p>
        <Button type="button" variant="ghost" size="sm" onClick={() => void load()}>
          Refresh
        </Button>
      </div>
      {error && <div className="alert alert-error text-sm" role="alert"><span>{error}</span></div>}
      {items.length === 0 ? (
        <EmptyState
          icon={Inbox}
          size="sm"
          title="No pending NamQR payments"
          description="When a guest submits a bank reference from the guest portal, it will appear here for approval."
        />
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
                  Post to folio
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={busyId === item.id}
                  onClick={() => openRejectDialog(item.id)}
                >
                  Reject
                </Button>
                <Button asChild size="sm" variant="ghost">
                  <Link href={`/bookings/${item.bookingId}`}>Open booking</Link>
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}

      <dialog ref={rejectDialogRef} className="modal" aria-labelledby="namqr-reject-title">
        <div className="modal-box">
          <h3 id="namqr-reject-title" className="font-bold text-lg">
            Reject guest NamQR payment?
          </h3>
          <p className="py-2 text-sm text-base-content/70">
            Optional: add a reason for the guest or audit trail.
          </p>
          <label className="form-control w-full">
            <span className="label">
              <span className="label-text">Reason (optional)</span>
            </span>
            <textarea
              className="textarea textarea-bordered w-full"
              rows={3}
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="e.g. Bank reference not found on statement"
            />
          </label>
          <div className="modal-action">
            <form method="dialog">
              <button
                type="button"
                className="btn btn-ghost rounded-full px-6"
                onClick={closeRejectDialog}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn btn-error rounded-full px-6"
                disabled={busyId === rejectTargetId}
                onClick={() => void confirmReject()}
              >
                Reject payment
              </button>
            </form>
          </div>
        </div>
        <form method="dialog" className="modal-backdrop">
          <button type="button" onClick={closeRejectDialog}>
            close
          </button>
        </form>
      </dialog>
    </div>
  );
}
