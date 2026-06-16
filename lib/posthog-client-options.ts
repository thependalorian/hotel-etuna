/**
 * Shared PostHog browser init options (client + instrumentation).
 * Location: /lib/posthog-client-options.ts
 *
 * @see https://posthog.com/docs/libraries/next-js
 * @see https://posthog.com/tutorials/single-page-app-pageviews
 */

import type { PostHogConfig } from 'posthog-js';
import { securityLogger } from '@/lib/utils/security-logger.client';

export function getPostHogApiKey(): string | undefined {
  return process.env.NEXT_PUBLIC_POSTHOG_KEY?.trim() || undefined;
}

export function getPostHogApiHost(): string {
  return process.env.NEXT_PUBLIC_POSTHOG_HOST?.trim() || 'https://us.i.posthog.com';
}

/** PostHog Cloud UI host (session replay / toolbar links). */
export function getPostHogUiHost(): string {
  return process.env.NEXT_PUBLIC_POSTHOG_UI_HOST?.trim() || getPostHogApiHost();
}

export function buildPostHogClientOptions(): Partial<PostHogConfig> {
  const apiHost = getPostHogApiHost();

  return {
    api_host: apiHost,
    ui_host: getPostHogUiHost(),
    /** SPA pageviews via history API (Next.js App Router). */
    defaults: '2026-01-30',
    session_recording: {
      maskAllInputs: true,
      maskTextSelector: '[data-sensitive]',
      recordCrossOriginIframes: true,
    },
    capture_pageleave: true,
    advanced_disable_decide: false,
    autocapture: {
      dom_event_allowlist: ['click', 'submit', 'change'],
      element_allowlist: ['button', 'a', 'form', 'input', 'select'],
      css_selector_allowlist: ['[data-ph-capture]', '.btn', '.dashboard-card', '[role="button"]'],
    },
    respect_dnt: true,
    opt_out_capturing_by_default: false,
    disable_session_recording: process.env.NODE_ENV === 'development',
    person_profiles: 'identified_only',
    bootstrap: {
      featureFlags: {},
    },
    loaded: () => {
      if (process.env.NODE_ENV === 'development') {
        securityLogger.debug('PostHog initialized');
      }
    },
  };
}
