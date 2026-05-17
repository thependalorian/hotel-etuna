'use client';

/**
 * PostHog Analytics Provider
 *
 * Wraps the app with @posthog/react for hooks; init is handled by
 * instrumentation-client.ts (SPA pageviews via defaults 2026-01-30).
 *
 * Location: /components/providers/PostHogProvider.tsx
 */

import { useEffect } from 'react';
import posthog from 'posthog-js';
import { PostHogProvider as PHProvider } from '@posthog/react';
import { getPostHogApiKey } from '@/lib/posthog-client-options';
import { initPostHog } from '@/lib/posthog';

export function PostHogProvider({ children }: { children: React.ReactNode }) {
  const apiKey = getPostHogApiKey();

  useEffect(() => {
    initPostHog();
  }, []);

  if (!apiKey) {
    return <>{children}</>;
  }

  return <PHProvider client={posthog}>{children}</PHProvider>;
}
