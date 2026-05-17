/**
 * PostHog Analytics Configuration
 *
 * Browser helpers + feature flags. Init runs in instrumentation-client.ts
 * and is idempotent via initPostHog() when instrumentation is skipped (tests).
 *
 * Location: /lib/posthog.ts
 */

import posthog from 'posthog-js';
import { buildPostHogClientOptions, getPostHogApiKey } from '@/lib/posthog-client-options';

export const initPostHog = () => {
  if (typeof window === 'undefined') {
    return null;
  }

  const apiKey = getPostHogApiKey();
  if (!apiKey) {
    console.warn('PostHog API key not configured. Analytics disabled.');
    return null;
  }

  const loaded = (posthog as typeof posthog & { __loaded?: boolean }).__loaded;
  if (!loaded) {
    posthog.init(apiKey, buildPostHogClientOptions());
  }

  return posthog;
};

export const trackEvent = (eventName: string, properties?: Record<string, unknown>) => {
  if (typeof window !== 'undefined' && posthog) {
    posthog.capture(eventName, properties);
  }
};

export const identifyUser = (
  userId: string,
  properties?: {
    email?: string;
    name?: string;
    role?: string;
    tenantId?: string;
    [key: string]: unknown;
  },
) => {
  if (typeof window !== 'undefined' && posthog) {
    posthog.identify(userId, properties);
  }
};

export const resetUser = () => {
  if (typeof window !== 'undefined' && posthog) {
    posthog.reset();
  }
};

export const isFeatureEnabled = (flagKey: string): boolean => {
  if (typeof window !== 'undefined' && posthog) {
    return posthog.isFeatureEnabled(flagKey) || false;
  }
  return false;
};

export const getFeatureFlagValue = (flagKey: string): string | boolean | undefined => {
  if (typeof window !== 'undefined' && posthog) {
    return posthog.getFeatureFlag(flagKey);
  }
  return undefined;
};

export const setUserProperties = (properties: Record<string, unknown>) => {
  if (typeof window !== 'undefined' && posthog) {
    posthog.people.set(properties);
  }
};

export const setGroup = (
  groupType: string,
  groupKey: string,
  groupProperties?: Record<string, unknown>,
) => {
  if (typeof window !== 'undefined' && posthog) {
    posthog.group(groupType, groupKey, groupProperties);
  }
};

/** Manual pageview — prefer SPA defaults; use for non-router flows only. */
export const trackPageView = (pageName?: string) => {
  if (typeof window !== 'undefined' && posthog) {
    posthog.capture('$pageview', {
      $current_url: window.location.href,
      page_name: pageName,
    });
  }
};

export const getServerPostHog = async () => {
  return null;
};

export const trackServerEvent = async (
  eventName: string,
  distinctId: string,
  properties?: Record<string, unknown>,
) => {
  void eventName;
  void distinctId;
  void properties;
};
