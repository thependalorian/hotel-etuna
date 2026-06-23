/**
 * GuestFinancialDocumentsCard — guest hub list/download/resend for tax PDFs.
 * Location: components/features/guest/GuestFinancialDocumentsCard.tsx
 *
 * Distinct from GuestDocumentVaultCard (travel ID uploads).
 */

'use client';

import { useCallback, useEffect, useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';

type DocRow = {
  id: string;
  documentType: string;
  referenceNumber: string;
  generatedAt: string;
};

interface GuestFinancialDocumentsCardProps {
  bookingId: string;
}

export function GuestFinancialDocumentsCard({ bookingId }: GuestFinancialDocumentsCardProps) {
  const [documents, setDocuments] = useState<DocRow[]>([]);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    const res = await fetch(`/api/guest/stays/${bookingId}/financial-documents`);
    const json = await res.json();
    if (json.success) setDocuments(json.data ?? []);
  }, [bookingId]);

  useEffect(() => {
    void load();
  }, [load]);

  async function resend(documentType: string) {
    setBusy(true);
    setError(null);
    setMessage(null);
    try {
      const res = await fetch(`/api/guest/stays/${bookingId}/financial-documents`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ documentType }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error?.message ?? 'Request failed');
      setMessage('Document emailed to you.');
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Request failed');
    } finally {
      setBusy(false);
    }
  }

  return (
    <section id="financial-documents">
    <Card variant="elevated">
      <h3 className="font-display text-lg font-semibold text-ink-900 mb-2">
        Financial documents
      </h3>
      <p className="text-sm text-ink-600 mb-4">
        Download quotations, receipts, and tax invoices. This is separate from travel ID uploads in
        your document vault.
      </p>

      {message ? <div className="alert alert-success mb-3 text-sm">{message}</div> : null}
      {error ? <div className="alert alert-error mb-3 text-sm">{error}</div> : null}

      <ul className="space-y-2 mb-4">
        {documents.length === 0 ? (
          <li className="text-sm text-ink-600">No PDFs issued yet for this stay.</li>
        ) : (
          documents.map((doc) => (
            <li
              key={doc.id}
              className="flex flex-wrap items-center justify-between gap-2 border border-nude-200 rounded-etuna-input p-3"
            >
              <div>
                <p className="font-medium text-ink-900">{doc.referenceNumber}</p>
                <p className="text-xs text-ink-600 capitalize">
                  {doc.documentType.replace('_', ' ')} ·{' '}
                  {new Date(doc.generatedAt).toLocaleDateString()}
                </p>
              </div>
              <a
                href={`/api/documents/${doc.id}/download`}
                className="btn btn-outline btn-sm rounded-full px-4"
                target="_blank"
                rel="noopener noreferrer"
              >
                Download
              </a>
            </li>
          ))
        )}
      </ul>

      <Button
        variant="outline"
        className="rounded-full px-6"
        disabled={busy}
        onClick={() => void resend('quotation')}
      >
        Resend latest quotation
      </Button>
    </Card>
    </section>
  );
}
