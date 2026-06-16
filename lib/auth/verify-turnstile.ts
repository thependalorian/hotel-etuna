/**
 * Cloudflare Turnstile verification for public registration (production bot protection).
 * Location: lib/auth/verify-turnstile.ts
 */
import { securityLogger } from '@/lib/utils/security-logger';

export function isTurnstileConfigured(): boolean {
  return Boolean(process.env.TURNSTILE_SECRET_KEY?.trim());
}

export function isTurnstileClientConfigured(): boolean {
  return Boolean(process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY?.trim());
}

type TurnstileVerifyResponse = {
  success?: boolean;
  'error-codes'?: string[];
};

/**
 * Verify Turnstile token server-side. Returns true when Turnstile is not configured (local dev).
 */
export async function verifyTurnstileToken(
  token: string | undefined | null,
  remoteIp?: string | null,
): Promise<boolean> {
  if (process.env.E2E_TURNSTILE_BYPASS === '1') {
    return true;
  }

  const secret = process.env.TURNSTILE_SECRET_KEY?.trim();
  if (!secret) {
    return true;
  }

  if (!token?.trim()) {
    return false;
  }

  const body = new URLSearchParams({
    secret,
    response: token.trim(),
  });
  if (remoteIp) {
    body.set('remoteip', remoteIp);
  }

  const res = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: body.toString(),
  });

  if (!res.ok) {
    securityLogger.error('[Turnstile] siteverify HTTP error', res.status);
    return false;
  }

  const data = (await res.json()) as TurnstileVerifyResponse;
  if (!data.success) {
    securityLogger.error('[Turnstile] verification failed', data['error-codes']);
  }
  return Boolean(data.success);
}
