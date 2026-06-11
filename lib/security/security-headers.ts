/**
 * Shared HTTP security headers for proxy / edge responses.
 * Location: /lib/security/security-headers.ts
 */

import type { NextResponse } from 'next/server';
import { getContentSecurityPolicyHeader } from '@/lib/security/content-security-policy';

export function applySecurityHeaders(response: NextResponse): void {
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');

  const csp = getContentSecurityPolicyHeader();
  if (csp) {
    response.headers.set('Content-Security-Policy', csp);
  }
}
