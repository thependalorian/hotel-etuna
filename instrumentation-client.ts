/**
 * Eager PostHog init for Next.js App Router (client instrumentation).
 * Location: /instrumentation-client.ts
 *
 * @see https://posthog.com/docs/libraries/next-js
 */

import posthog from 'posthog-js';
import { buildPostHogClientOptions, getPostHogApiKey } from '@/lib/posthog-client-options';

const apiKey = getPostHogApiKey();

if (apiKey && typeof window !== 'undefined') {
  const loaded = (posthog as typeof posthog & { __loaded?: boolean }).__loaded;
  if (!loaded) {
    posthog.init(apiKey, buildPostHogClientOptions());
  }
}
