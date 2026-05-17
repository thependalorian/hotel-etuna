/**
 * Audit Log List Component
 *
 * Purpose: Platform `audit_trail` (Drizzle) with resource/action filters for compliance review
 * Location: components/features/admin/platform/AuditLogList.tsx
 */

'use client';

import { usePlatformToast } from '@/components/PlatformToastProvider';
import {
  messageFromFailedResponse,
  networkErrorMessage,
  rateLimitMessage,
} from '@/lib/utils/api-error-message';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import EmptyState from '@/components/shared/EmptyState';
import NoticeState from '@/components/shared/NoticeState';
import { FileText, RefreshCw } from 'lucide-react';
import {
  RESOURCE_TYPE_FILTER_OPTIONS,
  ACTION_FILTER_OPTIONS,
} from '@/lib/compliance/audit-filters';
import { apiUrl } from '@/lib/utils/api-url';

interface AuditLogEntry {
  id: string;
  tenantId: string | null;
  tenantName: string | null;
  userId: string | null;
  userEmail: string | null;
  action: string;
  resourceType: string;
  resourceId: string | null;
  timestamp: string | null;
  ipAddress: string | null;
  oldValues: unknown;
  newValues: unknown;
}

export default function AuditLogList() {
  const { showToast } = usePlatformToast();
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [resourceType, setResourceType] = useState<string>('all');
  const [actionFilter, setActionFilter] = useState<string>('all');
  const [limit] = useState(50);
  const [offset, setOffset] = useState(0);
  const [detail, setDetail] = useState<AuditLogEntry | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const fetchLogs = useCallback(
    async (signal?: AbortSignal) => {
      setLoading(true);
      setFetchError(null);
      try {
        const params = new URLSearchParams();
        params.set('limit', String(limit));
        params.set('offset', String(offset));
        if (resourceType !== 'all') params.set('resourceType', resourceType);
        if (actionFilter !== 'all') params.set('action', actionFilter);
        const res = await fetch(apiUrl(`/api/admin/platform/audit?${params.toString()}`), {
          credentials: 'include',
          signal,
        });
        if (!res.ok) {
          const msg =
            res.status === 429 ? await rateLimitMessage(res) : await messageFromFailedResponse(res);
          setFetchError(msg);
          showToast({ variant: 'error', title: 'Could not load audit log', message: msg });
          setLogs([]);
          return;
        }
        const data: unknown = await res.json();
        const list =
          data &&
          typeof data === 'object' &&
          'logs' in data &&
          Array.isArray((data as { logs: unknown }).logs)
            ? ((data as { logs: AuditLogEntry[] }).logs as AuditLogEntry[])
            : null;
        if (!list) {
          const msg = 'Unexpected response from server.';
          setFetchError(msg);
          showToast({ variant: 'error', title: 'Invalid response', message: msg });
          setLogs([]);
          return;
        }
        setLogs(list);
      } catch (error) {
        if (signal?.aborted) return;
        const msg = networkErrorMessage(error);
        setFetchError(msg);
        showToast({ variant: 'error', title: 'Could not load audit log', message: msg });
        setLogs([]);
        console.error('Error fetching audit logs:', error);
      } finally {
        if (!signal?.aborted) setLoading(false);
      }
    },
    [limit, offset, resourceType, actionFilter, showToast],
  );

  useEffect(() => {
    abortRef.current?.abort();
    const ac = new AbortController();
    abortRef.current = ac;
    void fetchLogs(ac.signal);
    return () => ac.abort();
  }, [fetchLogs]);

  const formatDate = (ts: string | null) => {
    if (!ts) return '—';
    try {
      return new Date(ts).toLocaleString();
    } catch {
      return ts;
    }
  };

  return (
    <div className="space-y-6">
      <div className="card bg-base-100 shadow-lg">
        <div className="card-body">
          <div className="flex flex-col gap-4">
            <div className="flex flex-col md:flex-row gap-4 flex-wrap">
              <select
                className="select select-bordered min-h-[44px] md:max-w-xs"
                value={resourceType}
                onChange={(e) => {
                  setResourceType(e.target.value);
                  setOffset(0);
                }}
              >
                {RESOURCE_TYPE_FILTER_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
              <select
                className="select select-bordered min-h-[44px] md:max-w-xs"
                value={actionFilter}
                onChange={(e) => {
                  setActionFilter(e.target.value);
                  setOffset(0);
                }}
              >
                {ACTION_FILTER_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
              <button
                type="button"
                className="btn btn-outline min-h-[44px]"
                onClick={() => fetchLogs()}
                disabled={loading}
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </button>
            </div>
            {fetchError && (
              <NoticeState
                variant="warning"
                title="Could not load audit log"
                message={fetchError}
                priority="assertive"
              />
            )}
            <NoticeState
              variant="info"
              message="Filter by resource type (e.g. support_ticket, consumer_rights_request) and action for ETA / PSD-12 evidence trails — not legal advice."
            />
          </div>
        </div>
      </div>

      <div className="card bg-base-100 shadow-lg">
        <div className="card-body">
          {loading ? (
            <div className="flex justify-center py-12">
              <span className="loading loading-spinner loading-lg" />
            </div>
          ) : fetchError ? (
            <EmptyState
              size="md"
              title="Audit log unavailable"
              description="Fix the issue above or retry. Check your connection and permissions."
              icon={<FileText className="h-10 w-10 text-base-content/50" aria-hidden />}
              action={{ label: 'Retry', onClick: () => void fetchLogs() }}
            />
          ) : logs.length === 0 ? (
            <EmptyState
              size="md"
              title="No audit entries"
              description="No rows match the current filters, or nothing has been logged yet."
              icon={<FileText className="h-10 w-10 text-base-content/50" aria-hidden />}
              action={{ label: 'Refresh', onClick: () => void fetchLogs() }}
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="table table-zebra">
                <thead>
                  <tr>
                    <th>Time</th>
                    <th>Action</th>
                    <th>Resource</th>
                    <th>Tenant</th>
                    <th>User</th>
                    <th>IP</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {logs.map((log) => (
                    <tr key={log.id}>
                      <td className="text-sm whitespace-nowrap">
                        {formatDate(log.timestamp)}
                      </td>
                      <td>
                        <span className="badge badge-ghost">{log.action}</span>
                      </td>
                      <td>
                        <span className="font-mono text-sm">
                          {log.resourceType}
                          {log.resourceId ? ` #${String(log.resourceId).slice(0, 8)}` : ''}
                        </span>
                      </td>
                      <td>{log.tenantName ?? '—'}</td>
                      <td>{log.userEmail ?? '—'}</td>
                      <td className="text-sm text-base-content/70">
                        {log.ipAddress ?? '—'}
                      </td>
                      <td>
                        <button
                          type="button"
                          className="btn btn-ghost btn-xs"
                          onClick={() => setDetail(log)}
                        >
                          Detail
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {!fetchError && !loading && logs.length > 0 && (offset > 0 || logs.length === limit) && (
        <div className="flex justify-center gap-2">
          <button
            type="button"
            className="btn btn-outline btn-sm"
            onClick={() => setOffset((o) => Math.max(0, o - limit))}
            disabled={offset === 0}
          >
            Previous
          </button>
          <button
            type="button"
            className="btn btn-outline btn-sm"
            onClick={() => setOffset((o) => o + limit)}
          >
            Next
          </button>
        </div>
      )}

      {detail && (
        <div className="modal modal-open">
          <div className="modal-box w-full max-w-lg mx-4 sm:mx-auto">
            <h3 className="font-bold text-lg mb-2">Audit detail</h3>
            <p className="text-sm text-base-content/70 mb-2">
              {detail.action} · {detail.resourceType}{' '}
              {detail.resourceId ? `(#${String(detail.resourceId).slice(0, 8)}…)` : ''}
            </p>
            <pre className="bg-base-200 rounded-lg p-3 text-xs overflow-x-auto max-h-64">
              {JSON.stringify(
                { oldValues: detail.oldValues, newValues: detail.newValues },
                null,
                2
              )}
            </pre>
            <div className="modal-action">
              <button type="button" className="btn" onClick={() => setDetail(null)}>
                Close
              </button>
            </div>
          </div>
          <div className="modal-backdrop" onClick={() => setDetail(null)} />
        </div>
      )}
    </div>
  );
}
