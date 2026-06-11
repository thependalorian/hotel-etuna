/**
 * FolioVoidTransactionDialog — staff void confirmation with reason codes.
 *
 * Purpose: Void an open folio charge via reversal line (immutable audit pattern).
 * Location: /components/features/folio/FolioVoidTransactionDialog.tsx
 */

'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import {
  FOLIO_VOID_REASON_CODES,
  FOLIO_VOID_REASON_LABELS,
  type FolioVoidReasonCode,
} from '@/lib/folio/void-reason-codes';

export type FolioVoidChargeTarget = {
  id: string;
  description: string;
  amount: number;
  currency: string;
};

type FolioVoidTransactionDialogProps = {
  charge: FolioVoidChargeTarget | null;
  open: boolean;
  onClose: () => void;
  onVoided: () => void;
};

export function FolioVoidTransactionDialog({
  charge,
  open,
  onClose,
  onVoided,
}: FolioVoidTransactionDialogProps) {
  const [reasonCode, setReasonCode] = useState<FolioVoidReasonCode>('staff_error');
  const [remark, setRemark] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!open || !charge) return null;

  const handleVoid = async () => {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/folio/charges/${charge.id}/void`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reasonCode,
          remark: remark.trim() || undefined,
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        throw new Error(json?.error?.message || 'Failed to void charge');
      }
      setRemark('');
      onVoided();
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to void charge');
    } finally {
      setBusy(false);
    }
  };

  return (
    <dialog open className="modal modal-open" aria-labelledby="folio-void-title">
      <div className="modal-box max-w-md">
        <h3 id="folio-void-title" className="font-bold text-lg text-nude-900">
          Void folio charge
        </h3>
        <p className="py-2 text-sm text-nude-600">
          Creates a reversal line; the original charge is marked voided for audit.
        </p>

        <div className="rounded-lg bg-nude-50 border border-nude-200 p-3 mb-4">
          <p className="font-medium text-nude-900">{charge.description}</p>
          <p className="text-sm font-mono text-nude-700">
            {charge.currency} {charge.amount.toFixed(2)}
          </p>
        </div>

        <fieldset className="fieldset gap-3">
          <legend className="fieldset-legend text-sm">Reason code</legend>
          <select
            className="select select-bordered w-full"
            value={reasonCode}
            onChange={(e) => setReasonCode(e.target.value as FolioVoidReasonCode)}
            aria-label="Void reason code"
          >
            {FOLIO_VOID_REASON_CODES.map((code) => (
              <option key={code} value={code}>
                {FOLIO_VOID_REASON_LABELS[code]}
              </option>
            ))}
          </select>

          <label className="form-control w-full">
            <span className="label-text text-sm">Remark (optional)</span>
            <textarea
              className="textarea textarea-bordered w-full"
              rows={2}
              value={remark}
              onChange={(e) => setRemark(e.target.value)}
              placeholder="Additional context for audit trail"
              maxLength={500}
            />
          </label>
        </fieldset>

        {error && (
          <div className="alert alert-error mt-3" role="alert">
            <span>{error}</span>
          </div>
        )}

        <div className="modal-action">
          <Button variant="ghost" className="rounded-full px-6" onClick={onClose} disabled={busy}>
            Cancel
          </Button>
          <Button
            className="rounded-full px-6 btn-error"
            onClick={() => void handleVoid()}
            isLoading={busy}
            disabled={busy}
          >
            Void charge
          </Button>
        </div>
      </div>
      <form method="dialog" className="modal-backdrop">
        <button type="button" onClick={onClose} aria-label="Close void dialog">
          close
        </button>
      </form>
    </dialog>
  );
}
