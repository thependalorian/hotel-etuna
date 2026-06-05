/**
 * PlatformAiObservability — Sofia AI token usage, confidence, and eval samples for Buffr Hub.
 * Location: components/features/admin/platform/PlatformAiObservability.tsx
 */

'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { Bot, RefreshCw } from 'lucide-react';
import { apiUrl } from '@/lib/utils/api-url';
import type { AiObservabilitySummary } from '@/lib/services/platform/AiObservabilityService';

export default function PlatformAiObservability() {
  const [days, setDays] = useState(30);
  const [summary, setSummary] = useState<AiObservabilitySummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(apiUrl(`/api/admin/platform/ai-observability?days=${days}`));
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(
          typeof body?.error === 'string' ? body.error : `Failed to load (${res.status})`,
        );
      }
      const body = (await res.json()) as { data?: AiObservabilitySummary };
      setSummary(body.data ?? null);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load observability');
      setSummary(null);
    } finally {
      setLoading(false);
    }
  }, [days]);

  useEffect(() => {
    void load();
  }, [load]);

  const providerEntries = Object.entries(summary?.tokensByProvider ?? {}).sort(
    (a, b) => b[1] - a[1],
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex gap-2">
          {[7, 30, 90].map((d) => (
            <button
              key={d}
              type="button"
              className={`btn btn-sm rounded-full px-4 ${days === d ? 'btn-primary' : 'btn-outline'}`}
              onClick={() => setDays(d)}
            >
              {d}d
            </button>
          ))}
        </div>
        <button
          type="button"
          className="btn btn-outline btn-sm rounded-full px-4 gap-2"
          onClick={() => void load()}
          disabled={loading}
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} aria-hidden />
          Refresh
        </button>
      </div>

      {error ? (
        <div className="alert alert-error" role="alert">
          <span>{error}</span>
        </div>
      ) : null}

      {loading && !summary ? (
        <div className="flex flex-col gap-3">
          <div className="skeleton h-24 w-full" />
          <div className="skeleton h-48 w-full" />
        </div>
      ) : null}

      {summary ? (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="stat bg-base-100 shadow rounded-box border border-base-300">
              <div className="stat-title">Conversations</div>
              <div className="stat-value text-2xl">{summary.totalConversations}</div>
              <div className="stat-desc">Last {summary.periodDays} days</div>
            </div>
            <div className="stat bg-base-100 shadow rounded-box border border-base-300">
              <div className="stat-title">Assistant messages</div>
              <div className="stat-value text-2xl">{summary.totalAssistantMessages}</div>
            </div>
            <div className="stat bg-base-100 shadow rounded-box border border-base-300">
              <div className="stat-title">Total tokens</div>
              <div className="stat-value text-2xl">{summary.totalTokens.toLocaleString()}</div>
            </div>
            <div className="stat bg-base-100 shadow rounded-box border border-base-300">
              <div className="stat-title">Avg confidence</div>
              <div className="stat-value text-2xl">
                {summary.avgConfidence > 0 ? `${(summary.avgConfidence * 100).toFixed(0)}%` : '—'}
              </div>
              <div className="stat-desc">
                {summary.lowConfidenceCount} low · {summary.degradedProviderCount} fallback
              </div>
            </div>
          </div>

          {providerEntries.length > 0 ? (
            <div className="card bg-base-100 shadow border border-base-300">
              <div className="card-body">
                <h2 className="card-title text-lg">Tokens by provider</h2>
                <ul className="space-y-2">
                  {providerEntries.map(([provider, tokens]) => (
                    <li key={provider} className="flex justify-between text-sm">
                      <span className="font-medium capitalize">{provider}</span>
                      <span>{tokens.toLocaleString()}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ) : null}

          <div className="card bg-base-100 shadow border border-base-300">
            <div className="card-body">
              <div className="flex items-center justify-between gap-2">
                <h2 className="card-title text-lg flex items-center gap-2">
                  <Bot className="w-5 h-5" aria-hidden />
                  Eval samples (low-signal turns)
                </h2>
                <Link
                  href="/crm/knowledge"
                  className="btn btn-outline btn-sm rounded-full px-4"
                >
                  Sofia knowledge
                </Link>
              </div>
              <p className="text-sm text-base-content/70 mb-4">
                Review low-confidence replies and add FAQs via knowledge ingest.
              </p>
              <div className="overflow-x-auto">
                <table className="table table-zebra table-sm">
                  <thead>
                    <tr>
                      <th>Channel</th>
                      <th>Intent</th>
                      <th>Confidence</th>
                      <th>Preview</th>
                      <th>When</th>
                    </tr>
                  </thead>
                  <tbody>
                    {summary.evalSamples.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="text-center text-base-content/60">
                          No samples in this period.
                        </td>
                      </tr>
                    ) : (
                      summary.evalSamples.map((row) => (
                        <tr key={`${row.conversationId}-${row.createdAt}`}>
                          <td>{row.channel}</td>
                          <td>{row.intent ?? '—'}</td>
                          <td>
                            {row.confidence !== null
                              ? `${(row.confidence * 100).toFixed(0)}%`
                              : '—'}
                          </td>
                          <td className="max-w-xs truncate">{row.preview}</td>
                          <td className="whitespace-nowrap text-xs">
                            {row.createdAt ? new Date(row.createdAt).toLocaleString() : '—'}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
}
