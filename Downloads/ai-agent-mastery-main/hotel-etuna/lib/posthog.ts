/**
 * PostHog Analytics Configuration
 * 
 * Provides product analytics, feature flags, session recording,
 * and user behavior tracking for Buffr Host.
 * 
 * Location: /lib/posthog.ts
 */

import posthog from 'posthog-js';

export const initPostHog = () => {
  if (typeof window !== 'undefined') {
    const apiKey = process.env.NEXT_PUBLIC_POSTHOG_KEY;
    const apiHost = process.env.NEXT_PUBLIC_POSTHOG_HOST || 'https://us.i.posthog.com';

    if (!apiKey) {
      console.warn('PostHog API key not configured. Analytics disabled.');
      return null;
    }

    posthog.init(apiKey, {
      api_host: apiHost,
      
      // Enable session recording
      session_recording: {
        maskAllInputs: true, // Mask sensitive inputs (passwords, credit cards)
        maskTextSelector: '[data-sensitive]', // Custom selector for sensitive data
        recordCrossOriginIframes: true,
      },
      
      // Capture pageviews automatically
      capture_pageview: true,
      
      // Capture pageleave events
      capture_pageleave: true,
      
      // Enable feature flags
      advanced_disable_decide: false,
      
      // Enable autocapture
      autocapture: {
        dom_event_allowlist: ['click', 'submit', 'change'],
        url_allowlist: [window.location.origin],
        element_allowlist: ['button', 'a', 'form', 'input', 'select'],
        css_selector_allowlist: [
          '[data-ph-capture]', // Custom attribute for explicit tracking
          '.btn',
          '.dashboard-card',
          '[role="button"]',
        ],
      },
      
      // Privacy settings
      respect_dnt: true, // Respect Do Not Track
      opt_out_capturing_by_default: false,
      
      // Performance
      loaded: (posthog) => {
        if (process.env.NODE_ENV === 'development') {
          console.log('✅ PostHog initialized');
        }
      },
      
      // Disable in development if needed
      disable_session_recording: process.env.NODE_ENV === 'development',
      
      // Person profiles
      person_profiles: 'identified_only', // Only create profiles for identified users
      
      // Bootstrap feature flags (optional)
      bootstrap: {
        featureFlags: {},
      },
    });

    return posthog;
  }

  return null;
};

/**
 * Track custom event
 */
export const trackEvent = (eventName: string, properties?: Record<string, any>) => {
  if (typeof window !== 'undefined' && posthog) {
    posthog.capture(eventName, properties);
  }
};

/**
 * Identify user
 */
export const identifyUser = (
  userId: string,
  properties?: {
    email?: string;
    name?: string;
    role?: string;
    tenantId?: string;
    [key: string]: any;
  }
) => {
  if (typeof window !== 'undefined' && posthog) {
    posthog.identify(userId, properties);
  }
};

/**
 * Reset user (on logout)
 */
export const resetUser = () => {
  if (typeof window !== 'undefined' && posthog) {
    posthog.reset();
  }
};

/**
 * Check if feature flag is enabled
 */
export const isFeatureEnabled = (flagKey: string): boolean => {
  if (typeof window !== 'undefined' && posthog) {
    return posthog.isFeatureEnabled(flagKey) || false;
  }
  return false;
};

/**
 * Get feature flag value
 */
export const getFeatureFlagValue = (flagKey: string): string | boolean | undefined => {
  if (typeof window !== 'undefined' && posthog) {
    return posthog.getFeatureFlag(flagKey);
  }
  return undefined;
};

/**
 * Set user properties
 */
export const setUserProperties = (properties: Record<string, any>) => {
  if (typeof window !== 'undefined' && posthog) {
    posthog.people.set(properties);
  }
};

/**
 * Group analytics (for tenants)
 */
export const setGroup = (groupType: string, groupKey: string, groupProperties?: Record<string, any>) => {
  if (typeof window !== 'undefined' && posthog) {
    posthog.group(groupType, groupKey, groupProperties);
  }
};

/**
 * Track page view manually
 */
export const trackPageView = (pageName?: string) => {
  if (typeof window !== 'undefined' && posthog) {
    posthog.capture('$pageview', {
      $current_url: window.location.href,
      page_name: pageName,
    });
  }
};

/**
 * Server-side PostHog client (for API routes)
 */
export const getServerPostHog = async () => {
  // Server analytics client lives in /lib/monitoring/posthog-server.ts.
  // Keep this shared file browser-safe because it is imported by client components.
  return null;
};

/**
 * Track server-side event
 */
export const trackServerEvent = async (
  eventName: string,
  distinctId: string,
  properties?: Record<string, any>
) => {
  void eventName;
  void distinctId;
  void properties;
  return;
};
