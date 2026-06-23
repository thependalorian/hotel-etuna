/**
 * Guest CRM memory & outreach — orchestrates data loading and composes sub-panels
 *
 * Purpose: Dashboard UI for `/crm/guests/[id]`; delegates presentation to `GuestCrm*` sections.
 * Location: components/features/crm/GuestCrmMemoryPanel.tsx
 */

'use client';

import { useCallback, useEffect, useState } from 'react';
import { apiUrl } from '@/lib/utils/api-url';
import LoadingSpinner from '@/components/shared/LoadingSpinner';
import GuestCrmMarketingSnapshot from '@/components/features/crm/GuestCrmMarketingSnapshot';
import GuestCrmFactsSection from '@/components/features/crm/GuestCrmFactsSection';
import GuestCrmGraphEdgesSection from '@/components/features/crm/GuestCrmGraphEdgesSection';
import GuestCrmMem0Section from '@/components/features/crm/GuestCrmMem0Section';
import GuestCrmOutreachSection from '@/components/features/crm/GuestCrmOutreachSection';
import { securityLogger } from '@/lib/utils/security-logger.client';
import type {
  GuestCrmMemoryBundle,
  GuestCrmOutreachTouch,
  GuestCrmTouchStatusAction,
} from '@/components/features/crm/guestCrmPanelTypes';

async function readApiError(res: Response): Promise<string> {
  try {
    const j = await res.json();
    return j?.error?.message ?? `Request failed (${res.status})`;
  } catch {
    return `Request failed (${res.status})`;
  }
}

export default function GuestCrmMemoryPanel({ guestId }: { guestId: string }) {
  const [bundle, setBundle] = useState<GuestCrmMemoryBundle | null>(null);
  const [touches, setTouches] = useState<GuestCrmOutreachTouch[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [factText, setFactText] = useState('');
  const [savingFact, setSavingFact] = useState(false);
  const [channel, setChannel] = useState('email');
  const [creatingTouch, setCreatingTouch] = useState(false);
  const [actionTouchId, setActionTouchId] = useState<string | null>(null);

  const loadAll = useCallback(async () => {
    setError('');
    setLoading(true);
    try {
      const [memRes, outRes] = await Promise.all([
        fetch(apiUrl(`/api/crm/guests/${guestId}/memory`)),
        fetch(apiUrl(`/api/crm/outreach?guestId=${encodeURIComponent(guestId)}`)),
      ]);

      if (!memRes.ok) {
        setError(await readApiError(memRes));
        setBundle(null);
        setTouches([]);
        return;
      }
      const memJson = await memRes.json();
      setBundle(memJson.data as GuestCrmMemoryBundle);

      if (outRes.ok) {
        const outJson = await outRes.json();
        setTouches((outJson.data?.touches ?? []) as GuestCrmOutreachTouch[]);
      } else {
        setTouches([]);
      }
    } catch (e) {
      securityLogger.error("[GuestCrmMemoryPanel] error", e);
      setError('Could not load CRM data.');
      setBundle(null);
    } finally {
      setLoading(false);
    }
  }, [guestId]);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  const addFact = async () => {
    const text = factText.trim();
    if (!text) return;
    setSavingFact(true);
    setError('');
    try {
      const res = await fetch(apiUrl(`/api/crm/guests/${guestId}/memory`), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ factText: text, source: 'staff' }),
      });
      if (!res.ok) {
        setError(await readApiError(res));
        return;
      }
      setFactText('');
      await loadAll();
    } catch (e) {
      securityLogger.error("[GuestCrmMemoryPanel] error", e);
      setError('Failed to save fact.');
    } finally {
      setSavingFact(false);
    }
  };

  const createTouch = async () => {
    setCreatingTouch(true);
    setError('');
    try {
      const res = await fetch(apiUrl('/api/crm/outreach'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ guestId, channel, status: 'draft' }),
      });
      if (!res.ok) {
        setError(await readApiError(res));
        return;
      }
      await loadAll();
    } catch (e) {
      securityLogger.error("[GuestCrmMemoryPanel] error", e);
      setError('Failed to create outreach touch.');
    } finally {
      setCreatingTouch(false);
    }
  };

  const patchTouch = async (touchId: string, status: GuestCrmTouchStatusAction) => {
    setActionTouchId(touchId);
    setError('');
    try {
      const res = await fetch(apiUrl(`/api/crm/outreach/${touchId}`), {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) {
        setError(await readApiError(res));
        return;
      }
      await loadAll();
    } catch (e) {
      securityLogger.error("[GuestCrmMemoryPanel] error", e);
      setError('Failed to update touch.');
    } finally {
      setActionTouchId(null);
    }
  };

  if (loading && !bundle) {
    return (
      <div className="rounded-etuna-input border border-nude-200 bg-surface-elevated">
        <div className="p-12 flex flex-col items-center justify-center">
          <LoadingSpinner size="md" text="Loading CRM memory…" />
        </div>
      </div>
    );
  }

  const insights = bundle?.insights;

  return (
    <div className="space-y-6">
      <div className="rounded-etuna-input border border-luxury-charlotte/30 bg-gradient-to-br from-luxury-champagne/20 to-white shadow-luxury-soft">
        <div className="p-6 space-y-6">
          <h3 className="font-display text-2xl font-bold text-ink-900 flex items-center gap-2">
            <span className="w-1.5 h-8 bg-luxury-charlotte rounded-full" />
            CRM Memory & Outreach
          </h3>
          {error && (
            <div className="flex items-start gap-3 p-4 bg-semantic-error-light text-semantic-error-dark rounded-etuna-input border border-semantic-error/20" role="alert">
              <svg className="w-5 h-5 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="text-sm font-medium">{error}</span>
            </div>
          )}

          {insights && <GuestCrmMarketingSnapshot insights={insights} />}

          <div className="grid gap-6 grid-cols-1 sm:grid-cols-2">
            <GuestCrmFactsSection
              facts={bundle?.facts ?? []}
              factText={factText}
              savingFact={savingFact}
              onFactTextChange={setFactText}
              onAddFact={addFact}
            />
            <GuestCrmGraphEdgesSection edges={bundle?.edges ?? []} />
          </div>

          <GuestCrmMem0Section lines={bundle?.mem0Lines ?? []} />

          <div className="divider" />

          <GuestCrmOutreachSection
            touches={touches}
            channel={channel}
            onChannelChange={setChannel}
            creatingTouch={creatingTouch}
            actionTouchId={actionTouchId}
            onCreateDraft={createTouch}
            onTransitionTouch={patchTouch}
          />
        </div>
      </div>
    </div>
  );
}
