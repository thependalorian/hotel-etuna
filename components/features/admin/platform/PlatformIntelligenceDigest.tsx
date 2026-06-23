/**
 * PlatformIntelligenceDigest — preview founder digest + send test email from platform console.
 * Location: components/features/admin/platform/PlatformIntelligenceDigest.tsx
 */

'use client';

import { useCallback, useEffect, useState } from 'react';
import { Mail, RefreshCw } from 'lucide-react';
import { apiUrl } from '@/lib/utils/api-url';
import type { IntelligenceDigest } from '@/lib/services/platform/IntelligenceReportService';
import { Button } from '@/components/ui/Button';

type Cadence = 'daily' | 'weekly' | 'monthly';

export default function PlatformIntelligenceDigest() {
  const [cadence, setCadence] = useState<Cadence>('daily');
  const [digest, setDigest] = useState<IntelligenceDigest | null>(null);
  const [plainText, setPlainText] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(apiUrl(`/api/admin/platform/intelligence-digest?cadence=${cadence}`));
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(typeof body?.error === 'string' ? body.error : `Failed (${res.status})`);
      }
      const body = (await res.json()) as {
        data?: { digest?: IntelligenceDigest; plainText?: string };
      };
      setDigest(body.data?.digest ?? null);
      setPlainText(body.data?.plainText ?? '');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load digest');
      setDigest(null);
      setPlainText('');
    } finally {
      setLoading(false);
    }
  }, [cadence]);

  useEffect(() => {
    void load();
  }, [load]);

  async function sendTestDigest() {
    setSending(true);
    setMessage(null);
    setError(null);
    try {
      const res = await fetch(apiUrl(`/api/admin/platform/intelligence-digest?cadence=${cadence}`), {
        method: 'POST',
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(typeof body?.error === 'string' ? body.error : `Send failed (${res.status})`);
      }
      const sent = body?.data?.emailsSent ?? 0;
      const skipped = body?.data?.skippedNoSmtp;
      setMessage(
        skipped
          ? 'SMTP not configured — digest built but email was skipped.'
          : `Test digest sent to ${sent} recipient(s).`,
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Send failed');
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="rounded-etuna-card border border-nude-200 bg-surface-elevated">
      <div className="p-6 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="font-display text-2xl font-bold text-ink-900 flex items-center gap-2">
              <Mail className="w-6 h-6" aria-hidden />
              Intelligence digest
            </h2>
            <p className="text-sm text-ink-600 mt-1">
              Founder cadence previews — same payload as cron email to{' '}
              <code className="text-xs bg-nude-100 px-1 rounded">FOUNDER_DIGEST_EMAIL</code>.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {(['daily', 'weekly', 'monthly'] as const).map((c) => (
              <Button
                key={c}
                type="button"
                size="sm"
                variant={cadence === c ? 'primary' : 'outline'}
                onClick={() => setCadence(c)}
              >
                {c}
              </Button>
            ))}
            <button
              type="button"
              className="btn btn-outline btn-sm rounded-full px-4 gap-2"
              onClick={() => void load()}
              disabled={loading}
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} aria-hidden />
              Refresh
            </button>
            <Button
              type="button"
              size="sm"
              onClick={() => void sendTestDigest()}
              disabled={sending || loading}
              isLoading={sending}
            >
              Send test digest
            </Button>
          </div>
        </div>

        {error ? (
          <div className="alert alert-error" role="alert">
            <span>{error}</span>
          </div>
        ) : null}
        {message ? (
          <div className="alert alert-success" role="status">
            <span>{message}</span>
          </div>
        ) : null}

        {loading ? (
          <div className="space-y-2">
            <div className="skeleton h-4 w-full" />
            <div className="skeleton h-4 w-5/6" />
            <div className="skeleton h-24 w-full" />
          </div>
        ) : digest ? (
          <div className="space-y-4">
            <p className="text-xs text-ink-600">
              {digest.windowLabel} · generated {new Date(digest.generatedAt).toLocaleString()}
            </p>
            {digest.sections.map((section) => (
              <div key={section.title} className="p-4 bg-nude-50 rounded-etuna-input border border-nude-200">
                <h3 className="font-semibold text-ink-900 mb-2">{section.title}</h3>
                <ul className="list-disc list-inside text-sm text-ink-800 space-y-1">
                  {section.bullets.map((b) => (
                    <li key={b}>{b}</li>
                  ))}
                </ul>
              </div>
            ))}
            <details className="collapse collapse-arrow bg-base-200">
              <summary className="collapse-title text-sm font-medium">Plain-text preview</summary>
              <pre className="collapse-content text-xs whitespace-pre-wrap p-4 font-mono">{plainText}</pre>
            </details>
          </div>
        ) : null}
      </div>
    </div>
  );
}
