/**
 * PostHog server-side capture (API routes, services)
 *
 * Purpose: Product analytics + error signals without blocking requests.
 * Location: /lib/monitoring/posthog-server.ts
 *
 * Env: NEXT_PUBLIC_POSTHOG_KEY (or POSTHOG_PROJECT_API_KEY), NEXT_PUBLIC_POSTHOG_HOST (optional)
 */

import 'server-only';

import { PostHog } from 'posthog-node';

let client: PostHog | null | undefined;

function getKey(): string | undefined {
  return (
    process.env.POSTHOG_PROJECT_API_KEY?.trim() || process.env.NEXT_PUBLIC_POSTHOG_KEY?.trim() || undefined
  );
}

function getHost(): string {
  return (
    process.env.NEXT_PUBLIC_POSTHOG_HOST?.trim() || process.env.POSTHOG_HOST?.trim() || 'https://us.i.posthog.com'
  );
}

export function getPostHogServer(): PostHog | null {
  if (client === undefined) {
    const key = getKey();
    if (!key) {
      client = null;
      return null;
    }
    client = new PostHog(key, {
      host: getHost(),
      flushAt: 10,
      flushInterval: 5000,
    });
  }
  return client;
}

export async function captureServerException(
  err: unknown,
  distinctId: string,
  properties?: Record<string, unknown>
): Promise<void> {
  const ph = getPostHogServer();
  if (!ph) return;
  const error = err instanceof Error ? err : new Error(String(err));
  try {
    const phAny = ph as PostHog & { captureException?: (e: Error, id: string, p?: object) => void };
    if (typeof phAny.captureException === 'function') {
      phAny.captureException(error, distinctId, properties);
    } else {
      ph.capture({
        distinctId,
        event: 'server_exception',
        properties: {
          message: error.message,
          name: error.name,
          ...(properties ?? {}),
        },
      });
    }
    await ph.flush();
  } catch (e) {
    console.error('[PostHog] captureServerException failed', e);
  }
}
