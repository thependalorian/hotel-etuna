/**
 * WorkflowStatusActions Component
 *
 * Purpose: Reusable client-side controls for PRD lifecycle transitions such as bookings and restaurant orders.
 * Location: /components/shared/WorkflowStatusActions.tsx
 */

'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { normalizeWorkflowStatus } from '@/lib/workflows/domainTransitions';
import { cn } from '@/lib/utils/cn';
import { securityLogger } from '@/lib/utils/security-logger.client';
import { Button } from '@/components/ui/Button';

type WorkflowStatusActionsProps = {
  currentStatus?: string | null;
  transitions: Record<string, string[]>;
  endpoint: string;
  labels?: Record<string, string>;
  className?: string;
  compact?: boolean;
  onUpdated?: (status: string) => void;
};

async function readApiMessage(response: Response): Promise<string> {
  try {
    const json = await response.json();
    return json?.error?.message ?? json?.error ?? `Request failed (${response.status})`;
  } catch {
    return `Request failed (${response.status})`;
  }
}

function defaultLabel(status: string): string {
  return status.replace(/_/g, ' ').replace(/\b\w/g, (letter) => letter.toUpperCase());
}

export function WorkflowStatusActions({
  currentStatus,
  transitions,
  endpoint,
  labels,
  className,
  compact = false,
  onUpdated,
}: WorkflowStatusActionsProps) {
  const router = useRouter();
  const normalizedStatus = normalizeWorkflowStatus(currentStatus || 'pending');
  const nextStatuses = useMemo(
    () => transitions[normalizedStatus] ?? [],
    [normalizedStatus, transitions]
  );
  const [pendingStatus, setPendingStatus] = useState<string | null>(null);
  const [error, setError] = useState('');

  const transition = async (status: string) => {
    setError('');
    setPendingStatus(status);
    try {
      const response = await fetch(endpoint, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });

      if (!response.ok) {
        setError(await readApiMessage(response));
        return;
      }

      onUpdated?.(status);
      router.refresh();
    } catch (err) {
      securityLogger.error('[WorkflowStatusActions]', err);
      setError('Could not update status. Please try again.');
    } finally {
      setPendingStatus(null);
    }
  };

  return (
    <div className={cn('space-y-2', className)}>
      {nextStatuses.length > 0 ? (
        <div className={cn('flex flex-wrap gap-2', compact && 'justify-end')}>
          {nextStatuses.map((status) => (
            <Button
              key={status}
              type="button"
              size="sm"
              variant={status === 'cancelled' || status === 'no_show' ? 'destructive' : 'primary'}
              className={cn('capitalize', compact && 'text-xs')}
              onClick={() => transition(status)}
              disabled={Boolean(pendingStatus)}
              aria-label={`Move workflow to ${defaultLabel(status)}`}
              isLoading={pendingStatus === status}
            >
              {labels?.[status] ?? defaultLabel(status)}
            </Button>
          ))}
        </div>
      ) : (
        <p className="text-xs font-medium text-ink-400">No further transitions available.</p>
      )}

      {error && (
        <div role="alert" className="alert alert-error py-2 text-sm">
          <span>{error}</span>
        </div>
      )}
    </div>
  );
}
