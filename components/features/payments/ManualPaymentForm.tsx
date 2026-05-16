/**
 * ManualPaymentForm — record off-platform EFT / e-wallet / bank deposit (folio).
 * NamQR bank-app payments: use NamQrDeskPanel (generate + confirm) on this page.
 * Location: components/features/payments/ManualPaymentForm.tsx
 */

'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/Button';

type Rail = 'eft' | 'ewallet' | 'bank_deposit';

export function ManualPaymentForm({
  bookingId,
  onSuccess,
}: {
  bookingId: string;
  onSuccess?: () => void;
}) {
  const [amount, setAmount] = useState('');
  const [rail, setRail] = useState<Rail>('eft');
  const [bankReference, setBankReference] = useState('');
  const [payerName, setPayerName] = useState('');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    const parsed = parseFloat(amount);
    if (!parsed || parsed <= 0) {
      setError('Enter a valid amount');
      return;
    }
    if (bankReference.trim().length < 3) {
      setError('Bank or wallet reference is required');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/payments/manual', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bookingId,
          amount: parsed,
          rail,
          bankReference: bankReference.trim(),
          payerName: payerName.trim() || undefined,
          notes: notes.trim() || undefined,
          applyToFolio: true,
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error ?? 'Failed to record payment');
      }
      setSuccess(`Recorded ${json.data?.transactionReference ?? 'payment'}`);
      setAmount('');
      setBankReference('');
      setPayerName('');
      setNotes('');
      onSuccess?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to record payment');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form className="space-y-4" onSubmit={handleSubmit}>
      <p className="text-xs text-base-content/70">
        For NamQR (guest paid via banking app after desk QR), use <strong>Generate NamQR</strong>{' '}
        on the left, then <strong>Confirm on folio</strong> — not this form.
      </p>
      <div className="form-control">
        <label className="label" htmlFor="manual-amount">
          <span className="label-text">Amount (NAD)</span>
        </label>
        <input
          id="manual-amount"
          type="number"
          step="0.01"
          min="0"
          className="input input-bordered w-full"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          required
        />
      </div>
      <div className="form-control">
        <label className="label" htmlFor="manual-rail">
          <span className="label-text">Payment rail</span>
        </label>
        <select
          id="manual-rail"
          className="select select-bordered w-full"
          value={rail}
          onChange={(e) => setRail(e.target.value as Rail)}
        >
          <option value="eft">EFT / bank transfer</option>
          <option value="ewallet">E-wallet / mobile money</option>
          <option value="bank_deposit">Bank deposit</option>
        </select>
      </div>
      <div className="form-control">
        <label className="label" htmlFor="manual-ref">
          <span className="label-text">Bank / wallet reference</span>
        </label>
        <input
          id="manual-ref"
          type="text"
          className="input input-bordered w-full"
          placeholder="e.g. EFT ref or wallet txn ID"
          value={bankReference}
          onChange={(e) => setBankReference(e.target.value)}
          required
        />
      </div>
      <div className="form-control">
        <label className="label" htmlFor="manual-payer">
          <span className="label-text">Payer name (optional)</span>
        </label>
        <input
          id="manual-payer"
          type="text"
          className="input input-bordered w-full"
          value={payerName}
          onChange={(e) => setPayerName(e.target.value)}
        />
      </div>
      <div className="form-control">
        <label className="label" htmlFor="manual-notes">
          <span className="label-text">Notes (optional)</span>
        </label>
        <textarea
          id="manual-notes"
          className="textarea textarea-bordered w-full"
          rows={2}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
        />
      </div>
      {error && <div className="alert alert-error text-sm">{error}</div>}
      {success && <div className="alert alert-success text-sm">{success}</div>}
      <Button type="submit" variant="primary" isLoading={isSubmitting} className="w-full">
        Record payment
      </Button>
    </form>
  );
}
