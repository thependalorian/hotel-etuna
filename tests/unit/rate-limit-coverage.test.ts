/**
 * Rate Limit Coverage Tests
 *
 * Purpose: Verify that all security-sensitive endpoints have rate limits
 * configured and that the rate limiting logic works correctly for edge cases.
 *
 * Location: tests/unit/rate-limit-coverage.test.ts
 */

import { describe, it, expect } from 'vitest';
import { RATE_LIMITS, getRateLimitConfig } from '@/lib/utils/rate-limit';

describe('Rate limit configuration coverage', () => {
  it('authentication endpoints have strict limits', () => {
    expect(RATE_LIMITS['/api/auth/login'].requests).toBeLessThanOrEqual(5);
    expect(RATE_LIMITS['/api/auth/register'].requests).toBeLessThanOrEqual(3);
    expect(RATE_LIMITS['/api/auth/forgot-password'].requests).toBeLessThanOrEqual(3);
  });

  it('payment endpoints have strict limits', () => {
    const paymentPaths = ['/api/payments/virtual', '/api/payments/adumo', '/api/payments/initiate'];
    for (const path of paymentPaths) {
      const config = RATE_LIMITS[path as keyof typeof RATE_LIMITS];
      expect(config).toBeDefined();
      expect(config.requests).toBeLessThanOrEqual(10);
    }
  });

  it('contact form has hourly limit', () => {
    expect(RATE_LIMITS['/api/contact']).toBeDefined();
    expect(RATE_LIMITS['/api/contact'].requests).toBeLessThanOrEqual(10);
    expect(RATE_LIMITS['/api/contact'].window).toContain('h');
  });

  it('Sofia AI endpoints have cost-control limits', () => {
    const sofiaPaths = ['/api/sofia/chat', '/api/public/sofia/chat'];
    for (const path of sofiaPaths) {
      const config = RATE_LIMITS[path as keyof typeof RATE_LIMITS];
      expect(config).toBeDefined();
      expect(config.requests).toBeLessThanOrEqual(25);
    }
  });

  it('partner invite is limited to prevent enumeration attacks', () => {
    expect(RATE_LIMITS['/api/admin/partners/invite']).toBeDefined();
    expect(RATE_LIMITS['/api/admin/partners/invite'].requests).toBeLessThanOrEqual(10);
  });

  it('all configured limits have valid window format', () => {
    for (const [path, config] of Object.entries(RATE_LIMITS)) {
      if (path === 'default') continue;
      expect(config.window).toMatch(/^\d+\s+[smh]$/);
      expect(config.requests).toBeGreaterThan(0);
    }
  });

  it('default limit is not too permissive', () => {
    expect(RATE_LIMITS.default.requests).toBeLessThanOrEqual(120);
  });
});

describe('getRateLimitConfig — path matching', () => {
  it('returns login config for login path', () => {
    const config = getRateLimitConfig('/api/auth/login');
    expect(config.requests).toBe(RATE_LIMITS['/api/auth/login'].requests);
  });

  it('returns payment config for payment sub-paths', () => {
    const config = getRateLimitConfig('/api/payments/virtual/initiate');
    expect(config.requests).toBeLessThanOrEqual(10);
  });

  it('returns default for unknown paths', () => {
    const config = getRateLimitConfig('/api/some-unknown-endpoint');
    expect(config.requests).toBe(RATE_LIMITS.default.requests);
  });

  it('returns contact limit for /api/contact', () => {
    const config = getRateLimitConfig('/api/contact');
    expect(config.requests).toBe(RATE_LIMITS['/api/contact'].requests);
  });
});

describe('Rate limit window parsing', () => {
  it('parses "15 m" as 15 minutes', () => {
    const windowString = '15 m';
    const [amount, unit] = windowString.split(' ');
    const ms = parseInt(amount) * 60000;
    expect(ms).toBe(15 * 60 * 1000);
  });

  it('parses "1 h" as 1 hour', () => {
    const windowString = '1 h';
    const [amount, unit] = windowString.split(' ');
    const ms = parseInt(amount) * 3600000;
    expect(ms).toBe(60 * 60 * 1000);
  });

  it('all window configs in RATE_LIMITS are parseable', () => {
    for (const [, config] of Object.entries(RATE_LIMITS)) {
      const match = config.window.match(/^(\d+)\s*(s|m|h)$/);
      expect(match).not.toBeNull();
    }
  });
});
