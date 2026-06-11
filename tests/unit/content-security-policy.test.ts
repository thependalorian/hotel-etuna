/**
 * CSP allowlist tests — PostHog, Stack Auth, Turnstile, Adumo.
 * Location: tests/unit/content-security-policy.test.ts
 */

import { describe, it, expect, afterEach } from 'vitest';
import {
  buildContentSecurityPolicy,
  PRODUCTION_CSP_HEADER,
} from '@/lib/security/content-security-policy';

describe('content-security-policy', () => {
  const originalEnv = { ...process.env };

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  it('returns undefined in development by default', () => {
    process.env.NODE_ENV = 'development';
    expect(buildContentSecurityPolicy()).toBeUndefined();
  });

  it('includes third-party payment and auth origins in production', () => {
    process.env.NODE_ENV = 'production';
    const csp = buildContentSecurityPolicy({ production: true });
    expect(csp).toBeDefined();
    expect(csp).toContain('https://api.stack-auth.com');
    expect(csp).toContain('https://challenges.cloudflare.com');
    expect(csp).toContain('https://staging-apiv3.adumoonline.com');
    expect(csp).toContain('https://apiv3.adumoonline.com');
    expect(csp).toContain('form-action');
  });

  it('PRODUCTION_CSP_HEADER matches vercel.json baseline allowlist', () => {
    expect(PRODUCTION_CSP_HEADER).toContain('https://us.i.posthog.com');
    expect(PRODUCTION_CSP_HEADER).toContain('frame-ancestors');
  });
});
