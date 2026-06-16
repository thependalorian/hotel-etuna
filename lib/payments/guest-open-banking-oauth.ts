/**
 * Guest Open Banking OAuth redirect helpers.
 * Location: lib/payments/guest-open-banking-oauth.ts
 *
 * Builds bank authorization URLs with signed state for folio payments.
 * ASPSP URL is configured per environment (sandbox vs production).
 */

import crypto from 'crypto';

export type GuestOpenBankingState = {
  bookingId: string;
  amount: number;
  userId: string;
  returnUrl: string;
  exp: number;
};

function stateSecret(): string {
  return process.env.NEXTAUTH_SECRET || process.env.OPEN_BANKING_STATE_SECRET || 'dev-open-banking-state';
}

export function signGuestOpenBankingState(payload: Omit<GuestOpenBankingState, 'exp'>, ttlSeconds = 900): string {
  const state: GuestOpenBankingState = {
    ...payload,
    exp: Math.floor(Date.now() / 1000) + ttlSeconds,
  };
  const body = Buffer.from(JSON.stringify(state)).toString('base64url');
  const sig = crypto.createHmac('sha256', stateSecret()).update(body).digest('base64url');
  return `${body}.${sig}`;
}

export function verifyGuestOpenBankingState(token: string): GuestOpenBankingState | null {
  const [body, sig] = token.split('.');
  if (!body || !sig) return null;
  const expected = crypto.createHmac('sha256', stateSecret()).update(body).digest('base64url');
  if (sig.length !== expected.length) return null;
  if (!crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected))) return null;
  try {
    const parsed = JSON.parse(Buffer.from(body, 'base64url').toString('utf8')) as GuestOpenBankingState;
    if (!parsed.bookingId || !parsed.userId || !parsed.returnUrl) return null;
    if (parsed.exp < Math.floor(Date.now() / 1000)) return null;
    return parsed;
  } catch {
    return null;
  }
}

/** Resolve ASPSP authorize base — explicit env or in-app sandbox consent screen. */
export function resolveGuestOpenBankingAuthorizeBase(): string | null {
  const explicit = process.env.OPEN_BANKING_GUEST_AUTHORIZE_URL?.trim();
  if (explicit) return explicit;
  const app = (process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000').replace(/\/$/, '');
  return `${app}/payment/open-banking/consent`;
}

export function buildGuestOpenBankingAuthorizeUrl(params: {
  bookingId: string;
  amount: number;
  userId: string;
  returnUrl: string;
}): string | null {
  const base = resolveGuestOpenBankingAuthorizeBase();
  if (!base) return null;

  const state = signGuestOpenBankingState(params);
  const url = new URL(base);
  url.searchParams.set('booking_id', params.bookingId);
  url.searchParams.set('amount', params.amount.toFixed(2));
  url.searchParams.set('return_url', params.returnUrl);
  url.searchParams.set('state', state);
  url.searchParams.set('scope', 'banking:payments.write');
  return url.toString();
}
