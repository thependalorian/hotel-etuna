/**
 * PlatformSupport — Platform admin support inbox and ticket reply.
 * Location: components/features/admin/platform/PlatformSupport.tsx
 * Fetches tickets, updates status, sends replies; shows errors via toasts and inline list error.
 */

'use client';

import { usePlatformToast } from '@/components/PlatformToastProvider';
import {
  messageFromFailedResponse,
  networkErrorMessage,
  rateLimitMessage,
} from '@/lib/utils/api-error-message';
import EmptyState from '@/components/shared/EmptyState';
import NotFoundState from '@/components/shared/NotFoundState';
import NoticeState from '@/components/shared/NoticeState';
import { LifeBuoy, ExternalLink } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { apiUrl } from '@/lib/utils/api-url';

/** Normalized row (API returns snake_case from SupportTicketListItem) */
export type SupportTicketRow = {
  id: string;
  tenantId: string;
  tenantName: string | null;
  subject: string;
  message: string;
  status: string;
  priority: string;
  createdAt: string;
  linearIssueUrl: string | null;
};

function normalizeTicket(o: Record<string, unknown>): SupportTicketRow | null {
  if (typeof o.id !== 'string' || typeof o.subject !== 'string' || typeof o.status !== 'string') {
    return null;
  }
  const tenantId = typeof o.tenant_id === 'string' ? o.tenant_id : '';
  const desc = typeof o.description === 'string' ? o.description : '';
  const created =
    typeof o.created_at === 'string'
      ? o.created_at
      : o.created_at instanceof Date
        ? o.created_at.toISOString()
        : '';
  if (!tenantId || !created) return null;
  return {
    id: o.id,
    tenantId,
    tenantName: typeof o.tenant_name === 'string' || o.tenant_name === null ? (o.tenant_name as string | null) : null,
    subject: o.subject,
    message: desc,
    status: o.status,
    priority: typeof o.priority === 'string' ? o.priority : 'medium',
    createdAt: created,
    linearIssueUrl:
      typeof o.linear_issue_url === 'string'
        ? o.linear_issue_url
        : o.linear_issue_url === null
          ? null
          : null,
  };
}

function isSupportTicketRow(value: unknown): value is SupportTicketRow {
  if (!value || typeof value !== 'object') return false;
  return normalizeTicket(value as Record<string, unknown>) !== null;
}

function supportStatusBadge(status: string): string {
  if (status === 'resolved' || status === 'closed') return 'badge-success';
  if (status === 'in_progress') return 'badge-info';
  if (status === 'pending') return 'badge-warning';
  return 'badge-outline';
}

function isTerminalSupportStatus(status: string): boolean {
  return status === 'resolved' || status === 'closed';
}

export default function PlatformSupport() {
  const { showToast } = usePlatformToast();
  const [tickets, setTickets] = useState<SupportTicketRow[]>([]);
  const [listLoading, setListLoading] = useState(true);
  const [listError, setListError] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [replyBody, setReplyBody] = useState('');
  const [sendingReply, setSendingReply] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [linearLoading, setLinearLoading] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  const selectedTicket = selectedId ? tickets.find((t) => t.id === selectedId) ?? null : null;
  const selectedIsTerminal = selectedTicket ? isTerminalSupportStatus(selectedTicket.status) : false;

  const loadTickets = useCallback(
    async (signal?: AbortSignal) => {
      setListLoading(true);
      setListError(null);
      try {
        const res = await fetch(apiUrl('/api/admin/platform/support/tickets'), {
          credentials: 'include',
          signal,
        });
        if (!res.ok) {
          const msg = res.status === 429 ? await rateLimitMessage(res) : await messageFromFailedResponse(res);
          setListError(msg);
          showToast({ variant: 'error', title: 'Could not load tickets', message: msg });
          setTickets([]);
          return;
        }
        const parsed: unknown = await res.json();
        const data =
          parsed && typeof parsed === 'object' && 'data' in parsed
            ? (parsed as { data: unknown }).data
            : parsed;
        const listCandidate =
          data && typeof data === 'object' && 'tickets' in (data as object)
            ? (data as { tickets: unknown }).tickets
            : null;
        if (!Array.isArray(listCandidate)) {
          const msg = 'Unexpected response from server.';
          setListError(msg);
          showToast({ variant: 'error', title: 'Invalid response', message: msg });
          setTickets([]);
          return;
        }
        const rows: SupportTicketRow[] = [];
        for (const item of listCandidate) {
          if (item !== null && typeof item === 'object') {
            const n = normalizeTicket(item as Record<string, unknown>);
            if (n) rows.push(n);
          }
        }
        setTickets(rows);
      } catch (e) {
        if (signal?.aborted) return;
        const msg = networkErrorMessage(e);
        setListError(msg);
        showToast({ variant: 'error', title: 'Could not load tickets', message: msg });
        setTickets([]);
      } finally {
        if (!signal?.aborted) setListLoading(false);
      }
    },
    [showToast],
  );

  useEffect(() => {
    abortRef.current?.abort();
    const ac = new AbortController();
    abortRef.current = ac;
    void loadTickets(ac.signal);
    return () => ac.abort();
  }, [loadTickets]);

  useEffect(() => {
    if (selectedId && !tickets.some((t) => t.id === selectedId)) {
      setSelectedId(null);
      setReplyBody('');
    }
  }, [tickets, selectedId]);

  async function updateStatus(status: 'open' | 'in_progress' | 'resolved' | 'closed') {
    if (!selectedId) return;
    setUpdatingStatus(true);
    try {
      const res = await fetch(apiUrl(`/api/admin/platform/support/tickets/${selectedId}`), {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ status }),
      });
      if (!res.ok) {
        const msg = res.status === 429 ? await rateLimitMessage(res) : await messageFromFailedResponse(res);
        showToast({ variant: 'error', title: 'Status not updated', message: msg });
        return;
      }
      const json = (await res.json()) as { ticket?: SupportTicketRow };
      const updated = json.ticket;
      if (updated && isSupportTicketRow(updated)) {
        setTickets((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));
        showToast({ variant: 'success', title: 'Status updated', message: `Set to ${status.replace('_', ' ')}.` });
      } else {
        showToast({ variant: 'warning', title: 'Updated', message: 'Status may have changed; refreshing list.' });
        await loadTickets();
      }
    } catch (e) {
      showToast({ variant: 'error', title: 'Status not updated', message: networkErrorMessage(e) });
    } finally {
      setUpdatingStatus(false);
    }
  }

  async function sendReply() {
    if (!selectedId || !replyBody.trim()) return;
    setSendingReply(true);
    try {
      const res = await fetch(apiUrl(`/api/admin/platform/support/tickets/${selectedId}/replies`), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ message: replyBody.trim() }),
      });
      if (!res.ok) {
        const msg = res.status === 429 ? await rateLimitMessage(res) : await messageFromFailedResponse(res);
        showToast({ variant: 'error', title: 'Reply not sent', message: msg });
        return;
      }
      setReplyBody('');
      showToast({ variant: 'success', title: 'Reply sent', message: 'The guest will be notified by email.' });
    } catch (e) {
      showToast({ variant: 'error', title: 'Reply not sent', message: networkErrorMessage(e) });
    } finally {
      setSendingReply(false);
    }
  }

  async function escalateLinear() {
    if (!selectedId) return;
    setLinearLoading(true);
    try {
      const res = await fetch(apiUrl(`/api/admin/platform/support/tickets/${selectedId}/linear`), {
        method: 'POST',
        credentials: 'include',
      });
      if (!res.ok) {
        const msg = res.status === 429 ? await rateLimitMessage(res) : await messageFromFailedResponse(res);
        showToast({ variant: 'error', title: 'Linear', message: msg });
        return;
      }
      const json = (await res.json()) as {
        data?: { linear_issue_url?: string; alreadyLinked?: boolean };
      };
      const url = json.data?.linear_issue_url;
      if (url) {
        setTickets((prev) =>
          prev.map((t) => (t.id === selectedId ? { ...t, linearIssueUrl: url } : t)),
        );
      }
      showToast({
        variant: 'success',
        title: json.data?.alreadyLinked ? 'Already in Linear' : 'Linear issue created',
        message: url ? 'Open Linear from the link below.' : 'OK',
      });
      await loadTickets();
    } catch (e) {
      showToast({ variant: 'error', title: 'Linear', message: networkErrorMessage(e) });
    } finally {
      setLinearLoading(false);
    }
  }

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
      <div className="card bg-base-100 shadow lg:col-span-1">
        <div className="card-body p-4">
          <div className="mb-2 flex items-center justify-between">
            <h2 className="card-title text-base">Tickets</h2>
            <button
              type="button"
              className="btn btn-ghost btn-xs"
              onClick={() => loadTickets()}
              disabled={listLoading}
            >
              Refresh
            </button>
          </div>
          {listError && (
            <NoticeState
              variant="warning"
              title="Could not load tickets"
              message={listError}
              className="mb-2"
              priority="assertive"
            />
          )}
          {listLoading ? (
            <div className="flex justify-center py-8">
              <span className="loading loading-spinner loading-md" />
            </div>
          ) : tickets.length === 0 ? (
            <EmptyState
              size="sm"
              className="shadow-none"
              icon={<LifeBuoy className="h-8 w-8 text-base-content/50" aria-hidden />}
              title="No support tickets"
              description="Guest and property messages will show up here when submitted."
            />
          ) : (
            <ul className="menu menu-sm bg-base-200 rounded-box max-h-[28rem] overflow-y-auto p-0">
              {tickets.map((t) => (
                <li key={t.id}>
                  <button
                    type="button"
                    className={selectedId === t.id ? 'active' : ''}
                    onClick={() => {
                      setSelectedId(t.id);
                      setReplyBody('');
                    }}
                  >
                    <span className="truncate font-medium">{t.subject}</span>
                    <span className={`badge badge-sm capitalize ${supportStatusBadge(t.status)}`}>
                      {t.status.replace('_', ' ')}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <div className="card bg-base-100 shadow lg:col-span-2">
        <div className="card-body">
          {!selectedTicket ? (
            <NotFoundState
              size="sm"
              className="shadow-none"
              title="No ticket selected"
              description="Choose a ticket from the list to read the thread and send a reply."
            />
          ) : (
            <>
              <h2 className="card-title">{selectedTicket.subject}</h2>
              <div className="flex flex-wrap items-center gap-2">
                <span className={`badge capitalize ${supportStatusBadge(selectedTicket.status)}`}>
                  {selectedTicket.status.replace('_', ' ')}
                </span>
                <span className="badge badge-outline capitalize">{selectedTicket.priority} priority</span>
                {selectedIsTerminal ? (
                  <span className="text-xs text-success">
                    Terminal state: replies are still allowed, but lifecycle actions are locked.
                  </span>
                ) : (
                  <span className="text-xs text-base-content/60">
                    Validated lifecycle: open → in progress → resolved → closed.
                  </span>
                )}
              </div>
              <p className="text-sm opacity-70">
                {selectedTicket.tenantName ?? 'Tenant'} · {new Date(selectedTicket.createdAt).toLocaleString()}
                {selectedTicket.linearIssueUrl ? (
                  <a
                    href={selectedTicket.linearIssueUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="link link-primary ml-2 inline-flex items-center gap-1"
                  >
                    Linear <ExternalLink className="h-3 w-3" aria-hidden />
                  </a>
                ) : null}
              </p>
              <div className="divider my-2" />
              <p className="whitespace-pre-wrap">{selectedTicket.message}</p>
              <div className="mt-4 flex flex-wrap gap-2">
                <button
                  type="button"
                  className="btn btn-sm btn-secondary"
                  disabled={linearLoading || Boolean(selectedTicket.linearIssueUrl)}
                  onClick={() => escalateLinear()}
                >
                  {linearLoading ? <span className="loading loading-spinner loading-sm" /> : 'Create Linear issue'}
                </button>
                <button
                  type="button"
                  className="btn btn-sm btn-outline"
                  disabled={updatingStatus || selectedTicket.status === 'in_progress' || selectedIsTerminal}
                  onClick={() => updateStatus('in_progress')}
                >
                  Mark in progress
                </button>
                <button
                  type="button"
                  className="btn btn-sm btn-outline"
                  disabled={updatingStatus || selectedTicket.status === 'resolved' || selectedTicket.status === 'closed'}
                  onClick={() => updateStatus('resolved')}
                >
                  Mark resolved
                </button>
                <button
                  type="button"
                  className="btn btn-sm btn-outline"
                  disabled={updatingStatus || selectedTicket.status === 'closed'}
                  onClick={() => updateStatus('closed')}
                >
                  Close
                </button>
              </div>
              <div className="mt-6">
                <label className="label py-0" htmlFor="support-reply">
                  <span className="label-text">Reply to guest</span>
                </label>
                <textarea
                  id="support-reply"
                  className="textarea textarea-bordered w-full mt-1"
                  rows={4}
                  value={replyBody}
                  onChange={(e) => setReplyBody(e.target.value)}
                  placeholder="Your message will be emailed to the property contact."
                  disabled={sendingReply}
                />
                <button
                  type="button"
                  className="btn btn-primary mt-2"
                  disabled={sendingReply || !replyBody.trim()}
                  onClick={sendReply}
                >
                  {sendingReply ? <span className="loading loading-spinner loading-sm" /> : 'Send reply'}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
