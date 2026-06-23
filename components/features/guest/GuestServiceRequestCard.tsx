/**
 * GuestServiceRequestCard
 *
 * Purpose: In-stay guest card to request housekeeping/amenities or report a
 *   maintenance issue, and view the status of past requests. Housekeeping &
 *   maintenance requests create a staff task server-side.
 * Location: /components/features/guest/GuestServiceRequestCard.tsx
 * Reference: PRD §1.1 Goal 1, §3.4a.
 */

'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import {
  GUEST_REQUEST_CATALOG,
  type GuestServiceRequestType,
} from '@/lib/services/guest/guest-service-request-mapping';

interface GuestServiceRequestRow {
  id: string;
  requestType: GuestServiceRequestType;
  category: string | null;
  description: string | null;
  status: string;
  priority: string;
  createdAt: string | null;
}

interface GuestServiceRequestCardProps {
  bookingId: string;
  /** Only checked-in stays can raise requests. */
  canRequest: boolean;
}

const STATUS_BADGE: Record<string, string> = {
  open: 'badge-warning',
  acknowledged: 'badge-info',
  in_progress: 'badge-info',
  resolved: 'badge-success',
  cancelled: 'badge-ghost',
};

const REQUEST_TYPES: GuestServiceRequestType[] = ['housekeeping', 'maintenance', 'amenity'];

export function GuestServiceRequestCard({ bookingId, canRequest }: GuestServiceRequestCardProps) {
  const [requests, setRequests] = useState<GuestServiceRequestRow[]>([]);
  const [requestType, setRequestType] = useState<GuestServiceRequestType>('housekeeping');
  const [category, setCategory] = useState<string>('');
  const [description, setDescription] = useState('');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const categories = useMemo(
    () => GUEST_REQUEST_CATALOG[requestType].categories,
    [requestType]
  );

  const load = useCallback(async () => {
    try {
      const res = await fetch(`/api/guest/stays/${bookingId}/requests`);
      const json = await res.json();
      if (res.ok) setRequests(json.data?.requests ?? []);
    } catch {
      // Non-fatal: the form still works without history.
    }
  }, [bookingId]);

  useEffect(() => {
    void load();
  }, [load]);

  const submit = async () => {
    if (!category && !description.trim()) {
      setError('Choose what you need or describe your request.');
      return;
    }
    setBusy(true);
    setMessage(null);
    setError(null);
    try {
      const res = await fetch(`/api/guest/stays/${bookingId}/requests`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          requestType,
          category: category || undefined,
          description: description.trim() || undefined,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error?.message || 'Could not submit your request');
      setMessage(json.data?.message || 'Request submitted');
      setCategory('');
      setDescription('');
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not submit your request');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Card variant="elevated" className="p-6 space-y-4">
      <div>
        <h3 className="font-display text-lg font-semibold text-ink-900">Concierge requests</h3>
        <p className="text-sm text-ink-600">
          Ask for service or report an issue — our team is notified right away.
        </p>
      </div>

      {canRequest ? (
        <div className="space-y-4">
          <div className="flex flex-wrap gap-2" role="tablist" aria-label="Request type">
            {REQUEST_TYPES.map((type) => (
              <Button
                key={type}
                size="sm"
                variant={requestType === type ? 'primary' : 'outline'}
                onClick={() => {
                  setRequestType(type);
                  setCategory('');
                }}
                aria-pressed={requestType === type}
              >
                {GUEST_REQUEST_CATALOG[type].label}
              </Button>
            ))}
          </div>

          <div className="flex flex-wrap gap-2">
            {categories.map((c) => (
              <button
                key={c.value}
                type="button"
                onClick={() => setCategory((cur) => (cur === c.value ? '' : c.value))}
                className={`rounded-full border px-4 py-1.5 text-sm transition ${
                  category === c.value
                    ? 'border-ci-accent-ochre bg-ci-cream text-ink-900'
                    : 'border-nude-200 bg-white text-ink-700 hover:border-ci-secondary-tan'
                }`}
                aria-pressed={category === c.value}
              >
                {c.label}
              </button>
            ))}
          </div>

          <label className="form-control w-full">
            <span className="label-text">
              {requestType === 'maintenance' ? 'Describe the issue' : 'Anything else? (optional)'}
            </span>
            <textarea
              className="textarea textarea-bordered w-full"
              rows={2}
              maxLength={2000}
              placeholder={
                requestType === 'maintenance'
                  ? 'e.g. The shower has no hot water this morning.'
                  : 'e.g. Two extra towels please.'
              }
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </label>

          {error && <p className="text-sm text-semantic-error-dark">{error}</p>}
          {message && (
            <div className="alert alert-success py-2">
              <span>{message}</span>
            </div>
          )}

          <Button disabled={busy} onClick={() => void submit()}>
            {busy ? 'Sending…' : 'Send request'}
          </Button>
        </div>
      ) : (
        <p className="text-sm text-ink-600">
          Concierge requests are available once you are checked in.
        </p>
      )}

      {requests.length > 0 && (
        <div className="pt-2">
          <h4 className="text-sm font-semibold text-ci-secondary-chocolate mb-2">Your requests</h4>
          <ul className="space-y-2">
            {requests.map((r) => {
              const label =
                GUEST_REQUEST_CATALOG[r.requestType]?.categories.find(
                  (c) => c.value === r.category
                )?.label ||
                r.category ||
                GUEST_REQUEST_CATALOG[r.requestType]?.label ||
                r.requestType;
              return (
                <li
                  key={r.id}
                  className="flex flex-wrap items-center justify-between gap-2 rounded-etuna-input border border-nude-200 p-3"
                >
                  <div>
                    <p className="font-medium text-ink-900">{label}</p>
                    {r.description && <p className="text-xs text-ink-600">{r.description}</p>}
                    {r.createdAt && (
                      <p className="text-xs text-ink-500">
                        {new Date(r.createdAt).toLocaleString()}
                      </p>
                    )}
                  </div>
                  <span className={`badge badge-sm ${STATUS_BADGE[r.status] ?? 'badge-ghost'}`}>
                    {r.status.replace('_', ' ')}
                  </span>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </Card>
  );
}
