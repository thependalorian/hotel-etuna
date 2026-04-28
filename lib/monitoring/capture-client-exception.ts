/**
 * Safe client-side exception reporting (PostHog Error Tracking)
 *
 * Purpose: Use after posthog.init; no-ops if PostHog is unavailable.
 * Location: /lib/monitoring/capture-client-exception.ts
 */

'use client';

export function captureClientException(
  error: Error,
  context?: Record<string, string | number | boolean | undefined>
): void {
  if (typeof window === 'undefined') return;
  try {
    import('posthog-js').then((posthog) => {
      const ph = posthog.default;
      if (typeof ph.captureException === 'function') {
        ph.captureException(error, context);
      }
    });
  } catch {
    /* optional dependency / init race */
  }
}
