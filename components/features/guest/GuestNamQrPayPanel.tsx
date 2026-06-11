/**
 * GuestNamQrPayPanel — Option B guest folio NamQR: scan, pay in bank app, submit reference.
 * Location: components/features/guest/GuestNamQrPayPanel.tsx
 */

'use client';

import { useCallback, useEffect, useState } from 'react';
import { Button } from '@/components/ui/Button';
import { NamQrQrDisplay } from '@/components/features/payments/NamQrQrDisplay';
import { NamQrSettlementNote } from '@/components/features/payments/NamQrSettlementNote';
import { NamQrAmountField } from '@/components/features/payments/NamQrAmountField';
import { NamQrBankReferenceField } from '@/components/features/payments/NamQrBankReferenceField';
import { formatFolioAmount } from '@/lib/utils/money';

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
        <NamQrSettlementNote variant="guest" />
      </div>

      <NamQrAmountField
        id="guest-namqr-amount"
        label="Amount (NAD)"
        value={amount}
        onChange={setAmount}
        min={0.01}
        max={balanceDue}
      />

      <Button type="button" disabled={busy || payAmount <= 0} onClick={() => void generateQr()}>
        Show payment QR
      </Button>

      {qr && (
        <NamQrQrDisplay
          qr={qr}
          variant="guest"
          imageAlt="NamQR payment code for Hotel Etuna"
        />
      )}

      <div className="space-y-2">
        <NamQrBankReferenceField
          id="guest-namqr-bank-ref"
          label="Bank reference (from your app after paying)"
          value={bankReference}
          onChange={setBankReference}
        />
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
              {formatFolioAmount('NAD', item.amountClaimed)} · ref {item.bankReference} ·{' '}
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