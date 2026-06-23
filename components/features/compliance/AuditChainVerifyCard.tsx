/**
 * AuditChainVerifyCard
 *
 * Purpose: Operator UI to verify tamper-evident audit_trail hash chain integrity.
 * Location: /components/features/compliance/AuditChainVerifyCard.tsx
 */

'use client';

import { useCallback, useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';

type VerifyResult = {
  valid: boolean;
  eventsChecked: number;
  hashedEventsChecked: number;
  unhashedEventsSkipped: number;
  tamperedEventId: string | null;
  tamperedReason: 'previous_hash_mismatch' | 'event_hash_mismatch' | null;
  tenantId: string;
  fromId: string | null;
  toId: string | null;
};

export function AuditChainVerifyCard() {
  const [verifying, setVerifying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<VerifyResult | null>(null);

  const handleVerify = useCallback(async () => {
    setVerifying(true);
    setError(null);
    try {
      const res = await fetch('/api/compliance/audit-chain/verify', {
        credentials: 'include',
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        const msg =
          json?.error?.message ?? json?.message ?? json?.error ?? res.statusText;
        throw new Error(typeof msg === 'string' ? msg : 'Verification failed');
      }
      const payload = (json?.data ?? json) as VerifyResult;
      setResult(payload);
    } catch (e) {
      setResult(null);
      setError(e instanceof Error ? e.message : 'Verification failed');
    } finally {
      setVerifying(false);
    }
  }, []);

  return (
    <Card className="p-4 space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="font-semibold text-lg">Audit hash chain</h3>
          <p className="text-sm text-ink-600 max-w-xl">
            SHA-256 chained integrity check on <code className="text-xs">audit_trail</code>.
            Legacy rows without hashes are skipped; new records extend the chain per tenant.
          </p>
        </div>
        <Button
          variant="outline"
          onClick={() => void handleVerify()}
          disabled={verifying}
          className="rounded-full px-6"
        >
          {verifying ? 'Verifying…' : 'Verify chain'}
        </Button>
      </div>

      {error && (
        <div className="alert alert-error" role="alert">
          <span>{error}</span>
        </div>
      )}

      {result && (
        <div
          className={`alert ${result.valid ? 'alert-success' : 'alert-error'}`}
          role="status"
          aria-live="polite"
        >
          <div className="flex flex-col gap-2 w-full">
            <span className="font-medium">
              {result.valid
                ? 'Chain integrity verified'
                : 'Chain integrity failure detected'}
            </span>
            <div className="stats stats-vertical sm:stats-horizontal shadow bg-base-100 w-full">
              <div className="stat py-2">
                <div className="stat-title text-xs">Rows in scope</div>
                <div className="stat-value text-lg">{result.eventsChecked}</div>
              </div>
              <div className="stat py-2">
                <div className="stat-title text-xs">Hashed rows</div>
                <div className="stat-value text-lg">{result.hashedEventsChecked}</div>
              </div>
              <div className="stat py-2">
                <div className="stat-title text-xs">Legacy skipped</div>
                <div className="stat-value text-lg">{result.unhashedEventsSkipped}</div>
              </div>
            </div>
            {!result.valid && result.tamperedEventId && (
              <p className="text-sm">
                Tampered record: <code className="text-xs">{result.tamperedEventId}</code>
                {result.tamperedReason ? ` (${result.tamperedReason})` : null}
              </p>
            )}
          </div>
        </div>
      )}
    </Card>
  );
}
