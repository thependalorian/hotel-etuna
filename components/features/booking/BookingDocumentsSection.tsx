/**
 * BookingDocumentsSection — staff generate and download guest financial PDFs.
 * Location: components/features/booking/BookingDocumentsSection.tsx
 */

'use client';

import { useCallback, useEffect, useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { formatDateTime } from '@/lib/formatters';

type DocRow = {
  id: string;
  documentType: string;
  referenceNumber: string;
  generatedAt: string;
  transactionId?: string | null;
};

const DOC_TYPES = [
  { value: 'quotation', label: 'Quotation' },
  { value: 'invoice', label: 'Tax invoice' },
  { value: 'receipt', label: 'Receipt' },
  { value: 'payment_notification', label: 'Payment notification' },
] as const;

interface BookingDocumentsSectionProps {
  bookingId: string;
}

export function BookingDocumentsSection({ bookingId }: BookingDocumentsSectionProps) {
  const [documents, setDocuments] = useState<DocRow[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [transactionId, setTransactionId] = useState('');
  const [documentType, setDocumentType] =
    useState<(typeof DOC_TYPES)[number]['value']>('quotation');

  const loadDocuments = useCallback(async () => {
    const res = await fetch(`/api/documents?bookingId=${bookingId}`);
    const json = await res.json();
    if (json.success) {
      setDocuments(json.data ?? []);
    }
  }, [bookingId]);

  useEffect(() => {
    void loadDocuments();
  }, [loadDocuments]);

  async function handleGenerate(emailToGuest: boolean) {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch('/api/documents/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bookingId,
          documentType,
          transactionId: transactionId.trim() || undefined,
          emailToGuest,
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err?.error?.message ?? 'Generate failed');
      }
      const blob = await res.blob();
      const ref = res.headers.get('X-Document-Reference') ?? 'document';
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${ref}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
      await loadDocuments();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Generate failed');
    } finally {
      setBusy(false);
    }
  }

  function downloadExisting(id: string, _reference: string) {
    window.open(`/api/documents/${id}/download`, '_blank', 'noopener,noreferrer');
  }

  return (
    <Card variant="elevated" id="documents">
      <h3 className="font-display text-lg font-semibold mb-3 text-ink-900">Financial documents</h3>
      <p className="text-sm text-ink-600 mb-4">
        Quotations, invoices, receipts, and payment notifications (NamRA-aligned PDFs).
      </p>

      <div className="flex flex-col gap-3 mb-4">
        <label className="form-control w-full">
          <span className="label-text text-sm">Document type</span>
          <select
            className="select select-bordered w-full rounded-full"
            value={documentType}
            onChange={(e) =>
              setDocumentType(e.target.value as (typeof DOC_TYPES)[number]['value'])
            }
          >
            {DOC_TYPES.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
        </label>
        {(documentType === 'receipt' || documentType === 'payment_notification') && (
          <label className="form-control w-full">
            <span className="label-text text-sm">Transaction ID (required)</span>
            <input
              className="input input-bordered w-full rounded-full"
              value={transactionId}
              onChange={(e) => setTransactionId(e.target.value)}
              placeholder="UUID from payments desk"
            />
          </label>
        )}
        <div className="flex flex-wrap gap-2">
          <Button
            variant="primary"
            className="rounded-full px-6"
            disabled={busy}
            onClick={() => void handleGenerate(false)}
          >
            {busy ? 'Generating…' : 'Download PDF'}
          </Button>
          <Button
            variant="outline"
            className="rounded-full px-6"
            disabled={busy}
            onClick={() => void handleGenerate(true)}
          >
            Email guest
          </Button>
        </div>
        {error ? <p className="text-sm text-error">{error}</p> : null}
      </div>

      <div className="overflow-x-auto table-scroll">
        <table className="table table-zebra table-sm">
          <thead>
            <tr>
              <th>Reference</th>
              <th>Type</th>
              <th>Issued</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {documents.length === 0 ? (
              <tr>
                <td colSpan={4} className="text-center text-ink-600">
                  No documents yet
                </td>
              </tr>
            ) : (
              documents.map((doc) => (
                <tr key={doc.id}>
                  <td className="font-mono text-xs">{doc.referenceNumber}</td>
                  <td>{doc.documentType}</td>
                  <td>{formatDateTime(doc.generatedAt)}</td>
                  <td>
                    <button
                      type="button"
                      className="btn btn-ghost btn-sm rounded-full"
                      onClick={() => downloadExisting(doc.id, doc.referenceNumber)}
                    >
                      Download
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </Card>
  );
}

