/**
 * Kitchen Ticket Board
 *
 * Purpose: Kanban-style kitchen print ticket board grouped by job status.
 * Location: /components/features/fnb/kitchen-ticket-board.tsx
 */

'use client';

import { useCallback, useEffect, useState } from 'react';
import LoadingSpinner from '@/components/shared/LoadingSpinner';
import EmptyState from '@/components/shared/EmptyState';
import { Button } from '@/components/ui/Button';
import ErrorDisplay from '@/components/shared/ErrorDisplay';
import { apiUrl } from '@/lib/utils/api-url';

export type KitchenTicketStatus = 'pending' | 'printing' | 'printed' | 'failed' | 'cancelled';

export interface KitchenTicket {
  id: string;
  propertyId: string;
  orderId?: string | null;
  station: string;
  status: KitchenTicketStatus;
  ticketType: string;
  ticketData: Record<string, unknown>;
  attempts: number;
  errorMessage?: string | null;
  createdAt: string;
  printedAt?: string | null;
}

interface KitchenTicketBoardProps {
  propertyId: string;
  station?: string;
  refreshIntervalMs?: number;
}

const COLUMNS: { key: KitchenTicketStatus; label: string; badge: string }[] = [
  { key: 'pending', label: 'Queued', badge: 'badge-warning' },
  { key: 'printing', label: 'Printing', badge: 'badge-info' },
  { key: 'printed', label: 'Done', badge: 'badge-success' },
  { key: 'failed', label: 'Failed', badge: 'badge-error' },
];

function unwrapData<T>(payload: unknown, fallback: T): T {
  if (payload && typeof payload === 'object' && 'data' in payload) {
    return ((payload as { data?: unknown }).data as T) ?? fallback;
  }
  return (payload as T) ?? fallback;
}

function ticketTitle(ticket: KitchenTicket): string {
  const data = ticket.ticketData ?? {};
  const orderNumber =
    typeof data.orderNumber === 'string' ? data.orderNumber : ticket.orderId?.slice(0, 8) ?? 'Ticket';
  const table =
    typeof data.tableNumber === 'string'
      ? `Table ${data.tableNumber}`
      : typeof data.roomNumber === 'string'
        ? `Room ${data.roomNumber}`
        : ticket.station;
  return `${orderNumber} · ${table}`;
}

function ticketItems(ticket: KitchenTicket): string[] {
  const items = ticket.ticketData?.items;
  if (!Array.isArray(items)) return [];
  return items.map((raw) => {
    if (!raw || typeof raw !== 'object') return 'Item';
    const row = raw as Record<string, unknown>;
    const qty = typeof row.quantity === 'number' ? row.quantity : 1;
    const name = typeof row.name === 'string' ? row.name : 'Item';
    return `${qty}× ${name}`;
  });
}

export default function KitchenTicketBoard({
  propertyId,
  station = 'kitchen',
  refreshIntervalMs = 15000,
}: KitchenTicketBoardProps) {
  const [tickets, setTickets] = useState<KitchenTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const fetchTickets = useCallback(async () => {
    if (!propertyId) return;
    try {
      const params = new URLSearchParams({ propertyId, station });
      const response = await fetch(apiUrl(`/api/fnb/print-jobs?${params.toString()}`));
      if (!response.ok) {
        throw new Error('Failed to load kitchen tickets');
      }
      const payload = await response.json();
      const data = unwrapData<KitchenTicket[]>(payload, []);
      setTickets(Array.isArray(data) ? data : []);
      setError('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load tickets');
    } finally {
      setLoading(false);
    }
  }, [propertyId, station]);

  useEffect(() => {
    setLoading(true);
    void fetchTickets();
  }, [fetchTickets]);

  useEffect(() => {
    if (!propertyId || refreshIntervalMs <= 0) return;
    const timer = setInterval(() => {
      void fetchTickets();
    }, refreshIntervalMs);
    return () => clearInterval(timer);
  }, [propertyId, refreshIntervalMs, fetchTickets]);

  const updateStatus = async (ticketId: string, status: KitchenTicketStatus) => {
    setUpdatingId(ticketId);
    try {
      const response = await fetch(apiUrl(`/api/fnb/print-jobs/${ticketId}/status`), {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ propertyId, status }),
      });
      if (!response.ok) {
        throw new Error('Could not update ticket status');
      }
      await fetchTickets();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Update failed');
    } finally {
      setUpdatingId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[320px] items-center justify-center">
        <LoadingSpinner size="lg" text="Loading kitchen board..." />
      </div>
    );
  }

  if (error && tickets.length === 0) {
    return (
      <ErrorDisplay error={error} title="Kitchen board unavailable" variant="full" />
    );
  }

  const activeTickets = tickets.filter((t) => t.status !== 'cancelled');

  if (activeTickets.length === 0) {
    return (
      <EmptyState
        title="No kitchen tickets"
        description="New orders will appear here when print jobs are queued."
        size="md"
      />
    );
  }

  return (
    <div className="space-y-4">
      {error ? (
        <div className="alert alert-warning" role="status">
          <span>{error}</span>
        </div>
      ) : null}

      <div className="buffr-tabs-scroll overflow-x-auto">
        <div className="grid min-w-[960px] grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          {COLUMNS.map((column) => {
            const columnTickets = activeTickets.filter((t) => t.status === column.key);
            return (
              <section
                key={column.key}
                className="dashboard-card flex flex-col gap-3 p-4"
                aria-label={`${column.label} tickets`}
              >
                <div className="flex items-center justify-between">
                  <h3 className="font-display text-lg font-semibold text-base-content">{column.label}</h3>
                  <span className={`badge badge-soft ${column.badge}`}>{columnTickets.length}</span>
                </div>

                <div className="flex flex-col gap-3">
                  {columnTickets.length === 0 ? (
                    <p className="text-sm text-base-content/60">No tickets</p>
                  ) : (
                    columnTickets.map((ticket) => (
                      <article key={ticket.id} className="card bg-base-200 shadow-sm">
                        <div className="card-body gap-2 p-4">
                          <h4 className="card-title text-base">{ticketTitle(ticket)}</h4>
                          <ul className="text-sm text-base-content/80">
                            {ticketItems(ticket).map((line) => (
                              <li key={`${ticket.id}-${line}`}>{line}</li>
                            ))}
                          </ul>
                          {ticket.errorMessage ? (
                            <p className="text-xs text-error">{ticket.errorMessage}</p>
                          ) : null}
                          <div className="card-actions mt-2 justify-end gap-2">
                            {column.key === 'pending' ? (
                              <Button
                                type="button"
                                size="sm"
                                disabled={updatingId === ticket.id}
                                onClick={() => updateStatus(ticket.id, 'printing')}
                              >
                                Start
                              </Button>
                            ) : null}
                            {column.key === 'printing' ? (
                              <button
                                type="button"
                                className="btn btn-success btn-sm"
                                disabled={updatingId === ticket.id}
                                onClick={() => updateStatus(ticket.id, 'printed')}
                              >
                                Complete
                              </button>
                            ) : null}
                            {column.key === 'failed' ? (
                              <button
                                type="button"
                                className="btn btn-outline btn-sm"
                                disabled={updatingId === ticket.id}
                                onClick={() => updateStatus(ticket.id, 'pending')}
                              >
                                Retry
                              </button>
                            ) : null}
                          </div>
                        </div>
                      </article>
                    ))
                  )}
                </div>
              </section>
            );
          })}
        </div>
      </div>
    </div>
  );
}
