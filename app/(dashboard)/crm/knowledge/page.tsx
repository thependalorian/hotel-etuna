/**
 * CRM — RAG knowledge ingest page
 *
 * Purpose: Route `/crm/knowledge`; loads properties and renders `CrmRagIngestPanel`.
 * Location: /app/(dashboard)/crm/knowledge/page.tsx
 */

'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import CrmRagIngestPanel from '@/components/features/crm/CrmRagIngestPanel';
import type { CrmRagIngestPropertyOption } from '@/components/features/crm/CrmRagIngestPanel';
import LoadingSpinner from '@/components/shared/LoadingSpinner';
import ErrorDisplay from '@/components/shared/ErrorDisplay';
import { apiUrl } from '@/lib/utils/api-url';
import { securityLogger } from '@/lib/utils/security-logger.client';

function normalizePropertiesPayload(raw: unknown): CrmRagIngestPropertyOption[] {
  const list = Array.isArray(raw)
    ? raw
    : raw && typeof raw === 'object' && Array.isArray((raw as { data?: unknown }).data)
      ? (raw as { data: unknown[] }).data
      : [];
  return list
    .filter((p): p is { id: string; name?: string } => p != null && typeof p === 'object' && 'id' in p)
    .map((p) => ({
      id: String(p.id),
      name: typeof p.name === 'string' && p.name.trim() ? p.name : 'Unnamed property',
    }));
}

export default function CrmKnowledgePage() {
  const { status } = useSession();
  const [properties, setProperties] = useState<CrmRagIngestPropertyOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (status !== 'authenticated') {
      if (status === 'unauthenticated') setLoading(false);
      return;
    }

    (async () => {
      try {
        const res = await fetch(apiUrl('/api/properties'));
        if (!res.ok) {
          throw new Error('Could not load properties');
        }
        const raw = await res.json();
        setProperties(normalizePropertiesPayload(raw));
      } catch (e) {
        securityLogger.error("[KnowledgePage] error", e);
        setError(e instanceof Error ? e.message : 'Failed to load properties');
      } finally {
        setLoading(false);
      }
    })();
  }, [status]);

  if (loading || status === 'loading') {
    return (
      <div className="flex items-center justify-center min-h-[40vh]">
        <LoadingSpinner size="lg" text="Loading…" />
      </div>
    );
  }

  if (error) {
    return (
      <ErrorDisplay error={error} title="CRM Knowledge" variant="full" className="my-4" />
    );
  }

  return (
    <div className="space-y-6 animate-fade-in max-w-3xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-2">
        <div>
          <h1 className="buffr-page-title mb-1">CRM · Knowledge</h1>
          <p className="text-base-content/70">Add text Sofia can retrieve when RAG is enabled.</p>
        </div>
        <Link href="/crm" className="btn btn-ghost min-h-[44px]">
          ← CRM dashboard
        </Link>
      </div>

      <CrmRagIngestPanel properties={properties} />
    </div>
  );
}
