/**
 * GuestNamQrPayPanel — Option B guest folio NamQR: scan, pay in bank app, submit reference.
 * Location: components/features/guest/GuestNamQrPayPanel.tsx
 */

'use client';

import { useCallback, useEffect, useState } from 'react';
import { Button } from '@/components/ui/Button';
import { HOTEL_ETUNA_SETTLEMENT } from '@/lib/platform/settlement-accounts';

type NamQrStatusItem = {
  id: string;
  amountClaimed: number;
  bankReference: string;
  status: string;
  createdAt?: string;
  rejectionReason?: string | null;
};

type GuestNamQrPayPanelProps = {
  bookingId: string;
  balanceDue: number;
  onUpdated?: () => void;
};

export function GuestNamQrPayPanel({
  bookingId,
  balanceDue,
  onUpdated,
}: GuestNamQrPayPanelProps) {
  const [amount, setAmount] = useState('');
  const [bankReference, setBankReference] = useState('');
  const [qr, setQr] = useState<{
    qrReference: string;
    qrImageUrl: string;
    expiresAt?: string;
  } | null>(null);
  const [statusItems, setStatusItems] = useState<NamQrStatusItem[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const payAmount = amount ? Math.min(parseFloat(amount) || balanceDue, balanceDue) : balanceDue;

  const loadStatus = useCallback(async () => {
    try {
      const res = await fetch(`/api/guest/stays/${bookingId}/namqr/status`);
      const json = await res.json();
      if (res.ok) {
        setStatusItems(json.data?.items ?? []);
      }
    } catch {
      /* non-blocking */
    }
  }, [bookingId]);

  useEffect(() => {
    setAmount(balanceDue > 0 ? balanceDue.toFixed(2) : '');
    void loadStatus();
  }, [balanceDue, loadStatus]);

  async function generateQr() {
    setError(null);
    setMessage(null);
    setBusy(true);
    try {
      const res = await fetch(`/api/guest/stays/${bookingId}/namqr/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: payAmount }),
      });
      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error?.message ?? 'Could not generate QR');
      }
      setQr({
        qrReference: json.data.qrReference,
        qrImageUrl: json.data.qrImageUrl,
        expiresAt: json.data.expiresAt,
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to generate QR');
    } finally {
      setBusy(false);
    }
  }

  async function submitPaid() {
    if (!bankReference.trim()) {
      setError('Enter the reference from your banking app');
      return;
    }
    setError(null);
    setMessage(null);
    setBusy(true);
    try {
      const res = await fetch(`/api/guest/stays/${bookingId}/namqr/notify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amountClaimed: payAmount,
          bankReference: bankReference.trim(),
          qrReference: qr?.qrReference,
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error?.message ?? 'Could not submit payment');
      }
      setMessage(json.data?.message ?? 'Submitted for confirmation.');
      setBankReference('');
      await loadStatus();
      onUpdated?.();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Submit failed');
    } finally {
      setBusy(false);
    }
  }

  const hasPending = statusItems.some((i) => i.status === 'pending');

  return (
    <div className="space-y-4 border-t border-nude-200 pt-4">
      <div>
        <h4 className="font-semibold text-terracotta-900">Pay with banking app (NamQR)</h4>
        <p className="text-sm text-nude-600 mt-1">
          Scan the QR in Nedbank, FNB, or another Namibian banking app. Payment goes to Hotel
          Etuna Nedbank{' '}
          <span className="font-mono">{HOTEL_ETUNA_SETTLEMENT.accountNumber}</span>. Reception
          confirms once the transfer appears on our statement — your folio updates then.
        </p>
      </div>

      <label className="form-control w-full">
        <span className="label-text">Amount (NAD)</span>
        <input
          type="number"
          step="0.01"
          min="0.01"
          max={balanceDue}
          className="input input-bordered w-full"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
        />
      </label>

      <Button type="button" disabled={busy || payAmount <= 0} onClick={() => void generateQr()}>
        Show payment QR
      </Button>

      {qr && (
        <div className="rounded-lg border border-nude-200 bg-white p-4 space-y-2">
          <p className="text-sm">
            Reference: <span className="font-mono">{qr.qrReference}</span>
          </p>
          {qr.expiresAt && (
            <p className="text-xs text-nude-500">
              QR expires: {new Date(qr.expiresAt).toLocaleString()}
            </p>
          )}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={qr.qrImageUrl}
            alt="NamQR payment code for Hotel Etuna"
            className="mx-auto max-w-[220px] rounded-lg bg-white p-2"
          />
        </div>
      )}

      <div className="space-y-2">
        <label className="form-control w-full">
          <span className="label-text">Bank reference (from your app after paying)</span>
          <input
            type="text"
            className="input input-bordered w-full"
            placeholder="e.g. payment confirmation number"
            value={bankReference}
            onChange={(e) => setBankReference(e.target.value)}
          />
        </label>
        <Button
          type="button"
          variant="secondary"
          disabled={busy || !bankReference.trim()}
          onClick={() => void submitPaid()}
        >
          I&apos;ve paid — notify hotel
        </Button>
      </div>

      {error && <div className="alert alert-error text-sm">{error}</div>}
      {message && <div className="alert alert-success text-sm">{message}</div>}
      {hasPending && (
        <p className="text-sm text-info">
          A payment is awaiting confirmation. Your folio balance will update after reception
          approves it.
        </p>
      )}

      {statusItems.length > 0 && (
        <ul className="text-xs text-nude-600 space-y-1">
          {statusItems.slice(0, 3).map((item) => (
            <li key={item.id}>
              NAD {item.amountClaimed.toFixed(2)} · ref {item.bankReference} ·{' '}
              <span className="capitalize">{item.status}</span>
              {item.status === 'rejected' && item.rejectionReason
                ? ` — ${item.rejectionReason}`
                : null}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}