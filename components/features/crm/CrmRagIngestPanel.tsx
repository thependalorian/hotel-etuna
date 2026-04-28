/**
 * CRM RAG knowledge ingest — paste text and upsert into Qdrant for Sofia
 *
 * Purpose: Staff UI for `POST /api/crm/rag/ingest`; tenant-wide or property-scoped chunks.
 * Location: /components/features/crm/CrmRagIngestPanel.tsx
 */

'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { apiUrl } from '@/lib/utils/api-url';

export type CrmRagIngestPropertyOption = { id: string; name: string };

const INGEST_ROLES = new Set(['owner', 'manager', 'admin']);

async function readApiError(res: Response): Promise<string> {
  try {
    const j = await res.json();
    return j?.error?.message ?? `Request failed (${res.status})`;
  } catch {
    return `Request failed (${res.status})`;
  }
}

export default function CrmRagIngestPanel({ properties }: { properties: CrmRagIngestPropertyOption[] }) {
  const { data: session, status } = useSession();
  const [source, setSource] = useState('');
  const [propertyId, setPropertyId] = useState('');
  const [body, setBody] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccessDetail] = useState<{ upserted: number; collection: string } | null>(null);
  const sourceInputRef = useRef<HTMLInputElement>(null);

  const canIngest = session?.user?.role && INGEST_ROLES.has(session.user.role as string);

  useEffect(() => {
    if (status === 'authenticated' && sourceInputRef.current) {
      sourceInputRef.current.focus();
    }
  }, [status]);

  const submit = async () => {
    setError('');
    setSuccessDetail(null);
    const src = source.trim();
    const text = body.trim();
    if (!src) {
      setError('Label / source is required (e.g. house-rules-2025).');
      return;
    }
    if (!text) {
      setError('Paste knowledge text to ingest.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch(apiUrl('/api/crm/rag/ingest'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          source: src,
          text,
          ...(propertyId ? { propertyId } : {}),
        }),
      });
      if (!res.ok) {
        setError(await readApiError(res));
        return;
      }
      const json = await res.json();
      const data = json?.data as { upserted?: number; collection?: string } | undefined;
      if (data && typeof data.upserted === 'number' && data.collection) {
        setSuccessDetail({ upserted: data.upserted, collection: data.collection });
        setBody('');
      } else {
        setError('Unexpected response from server.');
      }
    } catch (e) {
      console.error(e);
      setError('Network error — try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (status === 'loading') {
    return (
      <div className="flex justify-center py-12">
        <span className="loading loading-spinner loading-lg text-primary" aria-label="Loading" />
      </div>
    );
  }

  if (!session) {
    return (
      <div role="alert" className="alert alert-warning">
        <span>Sign in to load knowledge into Sofia&apos;s retrieval index.</span>
      </div>
    );
  }

  return (
    <div className="card bg-base-100 shadow-lg border border-base-300">
      <div className="card-body gap-4">
        <div>
          <h2 className="card-title text-xl font-display">Knowledge base (RAG)</h2>
          <p className="text-sm text-base-content/70 mt-1">
            Text is chunked, embedded, and stored in Qdrant for this tenant. Sofia uses it when{' '}
            <code className="text-xs bg-base-200 px-1 rounded">RAG_ENABLED=true</code>.
          </p>
        </div>

        {!canIngest && (
          <div role="alert" className="alert alert-info">
            <span>
              Only <strong>owner</strong>, <strong>manager</strong>, or <strong>admin</strong> can ingest.
              Your role: <code className="text-xs">{session.user?.role ?? '—'}</code>.
            </span>
          </div>
        )}

        {error && (
          <div role="alert" className="alert alert-error">
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div role="alert" className="alert alert-success">
            <span>
              Ingested <strong>{success.upserted}</strong> chunk{success.upserted === 1 ? '' : 's'} into{' '}
              <code className="text-xs">{success.collection}</code>.
            </span>
          </div>
        )}

        <div className="form-control w-full">
          <label className="label" htmlFor="rag-source">
            <span className="label-text">Source label</span>
          </label>
          <input
            ref={sourceInputRef}
            id="rag-source"
            type="text"
            className="input input-bordered w-full min-h-[44px]"
            placeholder="e.g. faq-check-in, pool-hours"
            value={source}
            onChange={(e) => setSource(e.target.value)}
            disabled={!canIngest || submitting}
            maxLength={500}
          />
        </div>

        <div className="form-control w-full">
          <label className="label" htmlFor="rag-property">
            <span className="label-text">Scope (optional)</span>
          </label>
          <select
            id="rag-property"
            className="select select-bordered w-full min-h-[44px]"
            value={propertyId}
            onChange={(e) => setPropertyId(e.target.value)}
            disabled={!canIngest || submitting}
          >
            <option value="">Whole tenant</option>
            {properties.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </div>

        <div className="form-control w-full">
          <label className="label" htmlFor="rag-body">
            <span className="label-text">Knowledge text</span>
          </label>
          <textarea
            id="rag-body"
            className="textarea textarea-bordered w-full min-h-[200px] text-base leading-relaxed"
            placeholder="Paste policies, amenity copy, local tips… Paragraphs become chunk boundaries."
            value={body}
            onChange={(e) => setBody(e.target.value)}
            disabled={!canIngest || submitting}
          />
        </div>

        <div className="card-actions justify-end">
          <button
            type="button"
            className="btn btn-primary min-h-[44px]"
            onClick={submit}
            disabled={!canIngest || submitting}
          >
            {submitting ? (
              <>
                <span className="loading loading-spinner loading-sm" />
                Ingesting…
              </>
            ) : (
              'Ingest to Qdrant'
            )}
          </button>
        </div>

        <p className="text-xs text-base-content/60">
          Needs <code className="bg-base-200 px-1 rounded">QDRANT_URL</code> and{' '}
          <code className="bg-base-200 px-1 rounded">VOYAGE_API_KEY</code> on the server.{' '}
          <Link href="/crm" className="link link-primary">
            Back to CRM
          </Link>
        </p>
      </div>
    </div>
  );
}
