/**
 * PlatformSecretsStatus — API key presence for Buffr Hub (never shows secret values).
 * Location: components/features/admin/platform/PlatformSecretsStatus.tsx
 */

'use client';

import { useCallback, useEffect, useState } from 'react';
import { KeyRound, RefreshCw } from 'lucide-react';
import { apiUrl } from '@/lib/utils/api-url';
import type { SecretStatusRow } from '@/lib/services/platform/SecretsStatusService';

type SecretsResponse = {
  secrets: SecretStatusRow[];
  missingRequired: string[];
};

export default function PlatformSecretsStatus() {
  const [data, setData] = useState<SecretsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(apiUrl('/api/admin/platform/secrets-status'));
      if (!res.ok) {
        throw new Error(`Failed to load (${res.status})`);
      }
      const json = (await res.json()) as { data?: SecretsResponse };
      setData(json.data ?? null);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load secrets status');
      setData(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const byCategory = (data?.secrets ?? []).reduce<Record<string, SecretStatusRow[]>>(
    (acc, row) => {
      const cat = row.category;
      if (!acc[cat]) acc[cat] = [];
      acc[cat].push(row);
      return acc;
    },
    {},
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
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

      {data?.missingRequired && data.missingRequired.length > 0 ? (
        <div className="alert alert-warning" role="status">
          <KeyRound className="w-5 h-5" aria-hidden />
          <span>
            Missing required: {data.missingRequired.join(', ')}. Set in Vercel project env or
            .env.local — never commit values.
          </span>
        </div>
      ) : (
        <div className="alert alert-success" role="status">
          <span>All required secrets are configured for this environment.</span>
        </div>
      )}

      {loading && !data ? (
        <div className="skeleton h-64 w-full" />
      ) : null}

      {Object.entries(byCategory).map(([category, rows]) => (
        <div key={category} className="card bg-base-100 shadow border border-base-300">
          <div className="card-body">
            <h2 className="card-title text-lg">{category}</h2>
            <div className="overflow-x-auto">
              <table className="table table-zebra">
                <thead>
                  <tr>
                    <th>Key</th>
                    <th>Required</th>
                    <th>Status</th>
                    <th>Notes</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row) => (
                    <tr key={row.key}>
                      <td>
                        <code className="text-xs">{row.key}</code>
                      </td>
                      <td>{row.required ? 'Yes' : 'No'}</td>
                      <td>
                        <span
                          className={`badge badge-sm rounded-full ${
                            row.configured ? 'badge-success' : 'badge-error'
                          }`}
                        >
                          {row.configured ? 'Set' : 'Missing'}
                        </span>
                      </td>
                      <td className="text-sm text-base-content/70">{row.notes ?? '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
