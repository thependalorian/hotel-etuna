/**
 * CommunicationsHubList — WhatsApp thread inbox for front desk and support.
 * Location: components/features/communications/CommunicationsHubList.tsx
 */

'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/Button';

type ThreadSummary = {
  sessionId: string;
  status: string | null;
  guestPhone: string | null;
  assignedInbox: string | null;
  whatsappProvider: string | null;
  lastMessage: string | null;
  lastMessageAt: string | null;
};

export function CommunicationsHubList() {
  const [threads, setThreads] = useState<ThreadSummary[]>([]);
  const [escalatedOnly, setEscalatedOnly] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const qs = escalatedOnly ? '?escalatedOnly=true' : '';
        const res = await fetch(`/api/communications/threads${qs}`);
        const json = (await res.json()) as {
          success?: boolean;
          data?: { threads?: ThreadSummary[] };
          error?: { message?: string };
        };
        if (!res.ok || !json.success) {
          throw new Error(json.error?.message ?? 'Failed to load threads');
        }
        if (!cancelled) {
          setThreads(json.data?.threads ?? []);
        }
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : 'Failed to load');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, [escalatedOnly]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <label className="label cursor-pointer gap-2">
          <input
            type="checkbox"
            className="checkbox checkbox-primary"
            checked={escalatedOnly}
            onChange={(e) => setEscalatedOnly(e.target.checked)}
          />
          <span className="label-text">Escalated only</span>
        </label>
      </div>

      {loading && (
        <div className="space-y-2">
          <div className="skeleton h-12 w-full" />
          <div className="skeleton h-12 w-full" />
        </div>
      )}

      {error && (
        <div className="alert alert-error" role="alert">
          <span>{error}</span>
        </div>
      )}

      {!loading && !error && threads.length === 0 && (
        <div className="text-center py-12 text-base-content/70">
          <p className="font-medium">No WhatsApp threads yet</p>
          <p className="text-sm mt-2">Guest messages via WhatsApp will appear here.</p>
        </div>
      )}

      {!loading && threads.length > 0 && (
        <div className="overflow-x-auto table-scroll">
          <table className="table table-zebra">
            <thead>
              <tr>
                <th>Guest</th>
                <th>Status</th>
                <th>Provider</th>
                <th>Last message</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {threads.map((t) => (
                <tr key={t.sessionId}>
                  <td>{t.guestPhone ?? '—'}</td>
                  <td>
                    {t.status === 'escalated' ? (
                      <span className="badge badge-warning badge-soft">Escalated</span>
                    ) : (
                      <span className="badge badge-ghost">{t.status ?? 'active'}</span>
                    )}
                  </td>
                  <td>
                    <span className="badge badge-outline">{t.whatsappProvider ?? '—'}</span>
                  </td>
                  <td className="max-w-xs truncate">{t.lastMessage ?? '—'}</td>
                  <td>
                    <Button asChild size="sm">
                      <Link href={`/communications/${encodeURIComponent(t.sessionId)}`}>
                        Open
                      </Link>
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
