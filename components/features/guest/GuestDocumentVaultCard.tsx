/**
 * GuestDocumentVaultCard — pre-arrival / in-stay travel document upload.
 * Location: /components/features/guest/GuestDocumentVaultCard.tsx
 */

'use client';

import { useCallback, useEffect, useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';

type DocRow = {
  id: string;
  docType: string;
  fileName: string;
  mimeType: string;
  createdAt: string;
};

interface GuestDocumentVaultCardProps {
  bookingId: string;
}

const DOC_TYPES = [
  { value: 'national_id', label: 'National ID' },
  { value: 'passport', label: 'Passport' },
  { value: 'visa', label: 'Visa' },
  { value: 'other', label: 'Other travel document' },
] as const;

export function GuestDocumentVaultCard({ bookingId }: GuestDocumentVaultCardProps) {
  const [documents, setDocuments] = useState<DocRow[]>([]);
  const [docType, setDocType] = useState<(typeof DOC_TYPES)[number]['value']>('passport');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const loadDocuments = useCallback(async () => {
    const res = await fetch(`/api/guest/stays/${bookingId}/documents`);
    const json = await res.json();
    if (res.ok) {
      setDocuments(json.data?.documents ?? []);
    }
  }, [bookingId]);

  useEffect(() => {
    void loadDocuments();
  }, [loadDocuments]);

  async function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setError(null);
    setMessage(null);

    if (file.size > 5 * 1024 * 1024) {
      setError('File must be 5MB or smaller.');
      return;
    }

    const allowed = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
    if (!allowed.includes(file.type)) {
      setError('Use JPG, PNG, WebP, or PDF.');
      return;
    }

    setBusy(true);
    try {
      const base64Content = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
          const result = String(reader.result ?? '');
          const comma = result.indexOf(',');
          resolve(comma >= 0 ? result.slice(comma + 1) : result);
        };
        reader.onerror = () => reject(new Error('Could not read file'));
        reader.readAsDataURL(file);
      });

      const res = await fetch(`/api/guest/stays/${bookingId}/documents`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          docType,
          fileName: file.name,
          mimeType: file.type,
          base64Content,
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        throw new Error(json?.error?.message ?? 'Upload failed');
      }
      setMessage('Document stored securely. Our team can view it when you arrive.');
      await loadDocuments();
      e.target.value = '';
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card variant="flat">
      <div className="card-body gap-4">
        <div>
          <h2 className="card-title font-display text-ink-900">Travel documents</h2>
          <p className="text-sm text-ink-600">
            Upload your ID or passport before arrival so check-in is smooth. Files are encrypted
            and only used for your stay. Quotations, receipts, and tax invoices are under{' '}
            <strong>Financial documents</strong> — not this vault.
          </p>
        </div>

        <label className="form-control w-full max-w-md">
          <span className="label-text">Document type</span>
          <select
            className="select select-bordered w-full"
            value={docType}
            onChange={(e) =>
              setDocType(e.target.value as (typeof DOC_TYPES)[number]['value'])
            }
            aria-label="Document type"
          >
            {DOC_TYPES.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
        </label>

        <label className="form-control w-full max-w-md">
          <span className="label-text">Choose file (max 5MB)</span>
          <input
            type="file"
            className="file-input file-input-bordered w-full"
            accept="image/jpeg,image/png,image/webp,application/pdf"
            disabled={busy}
            onChange={(e) => void onFileChange(e)}
            aria-label="Upload travel document"
          />
        </label>

        {busy && (
          <span className="loading loading-spinner loading-sm text-primary" aria-hidden="true" />
        )}
        {message && (
          <div className="alert alert-success" role="status">
            <span>{message}</span>
          </div>
        )}
        {error && (
          <div className="alert alert-error" role="alert">
            <span>{error}</span>
          </div>
        )}

        {documents.length > 0 && (
          <ul className="divide-y divide-nude-200 rounded-etuna-input border border-nude-200">
            {documents.map((doc) => (
              <li key={doc.id} className="flex justify-between gap-2 px-4 py-3 text-sm">
                <span className="font-medium text-ink-800">{doc.fileName}</span>
                <span className="badge badge-ghost badge-sm">{doc.docType.replace('_', ' ')}</span>
              </li>
            ))}
          </ul>
        )}

        <Button
          type="button"
          variant="outline"
          className="w-fit"
          onClick={() => void loadDocuments()}
          disabled={busy}
        >
          Refresh list
        </Button>
      </div>
    </Card>
  );
}
