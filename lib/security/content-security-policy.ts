/**
 * Content-Security-Policy builder for Hotel Etuna (production).
 *
 * Purpose: single allowlist for PostHog, Stack Auth, Cloudflare Turnstile, Adumo Virtual POST,
 * and Vercel asset hosts. Used by proxy.ts and vercel.json (keep in sync via PRODUCTION_CSP_HEADER).
 * Location: /lib/security/content-security-policy.ts
 */

import { getPostHogApiHost, getPostHogUiHost } from '@/lib/posthog-client-options';

const ADUMO_ORIGINS = [
  'https://staging-apiv3.adumoonline.com',
  'https://apiv3.adumoonline.com',
] as const;

const STACK_AUTH_ORIGINS = ['https://api.stack-auth.com'] as const;

const TURNSTILE_ORIGINS = ['https://challenges.cloudflare.com'] as const;

const POSTHOG_ASSET_SUFFIXES = ['-assets.i.posthog.com'] as const;

function uniqueOrigins(origins: string[]): string[] {
  return [...new Set(origins.filter(Boolean))];
}

function postHogAssetOrigin(apiHost: string): string | null {
  try {
    const url = new URL(apiHost);
    const host = url.hostname.replace(/^([a-z]{2})\./, `$1-assets.`);
    if (host.endsWith('.posthog.com')) {
      return `${url.protocol}//${host}`;
    }
  } catch {
    /* ignore invalid host */
  }
  for (const suffix of POSTHOG_ASSET_SUFFIXES) {
    if (apiHost.includes('us.i.posthog')) return 'https://us-assets.i.posthog.com';
    if (apiHost.includes('eu.i.posthog')) return 'https://eu-assets.i.posthog.com';
    if (apiHost.includes(suffix)) return `https://${suffix}`;
  }
  return null;
}

export type ContentSecurityPolicyOptions = {
  /** When false, returns undefined (local dev — avoid breaking HMR / inline devtools). */
  production?: boolean;
};

/**
 * Build CSP directive string. Returns undefined outside production unless forced.
 */
export function buildContentSecurityPolicy(
  options: ContentSecurityPolicyOptions = {},
): string | undefined {
  const isProduction =
    options.production ?? process.env.NODE_ENV === 'production';

  if (!isProduction) {
    return undefined;
  }

  const posthogApi = getPostHogApiHost();
  const posthogUi = getPostHogUiHost();
  const posthogAsset = postHogAssetOrigin(posthogApi);

  const scriptSrc = uniqueOrigins([
    "'self'",
    "'unsafe-inline'",
    "'unsafe-eval'",
    ...TURNSTILE_ORIGINS,
    posthogApi,
    posthogAsset ?? '',
  ]);

  const connectSrc = uniqueOrigins([
    "'self'",
    'https:',
    ...STACK_AUTH_ORIGINS,
    ...TURNSTILE_ORIGINS,
    ...ADUMO_ORIGINS,
    posthogApi,
    posthogUi,
    posthogAsset ?? '',
  ]);

  const frameSrc = uniqueOrigins(["'self'", ...TURNSTILE_ORIGINS]);

  const formAction = uniqueOrigins(["'self'", ...ADUMO_ORIGINS]);

  const imgSrc = ["'self'", 'data:', 'blob:', 'https:'];

  const directives: Record<string, string[]> = {
    'default-src': ["'self'"],
    'base-uri': ["'self'"],
    'object-src': ["'none'"],
    'script-src': scriptSrc,
    'style-src': ["'self'", "'unsafe-inline'"],
    'img-src': imgSrc,
    'font-src': ["'self'", 'data:'],
    'connect-src': connectSrc,
    'frame-src': frameSrc,
    'frame-ancestors': ["'none'"],
    'form-action': formAction,
    'worker-src': ["'self'", 'blob:'],
  };

  return Object.entries(directives)
    .map(([name, values]) => `${name} ${values.join(' ')}`)
    .join('; ');
}

/**
 * Static production CSP for vercel.json (default PostHog US host).
 * If NEXT_PUBLIC_POSTHOG_HOST differs in production, proxy.ts applies the dynamic policy on matched routes.
 */
export const PRODUCTION_CSP_HEADER =
  "default-src 'self'; base-uri 'self'; object-src 'none'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://challenges.cloudflare.com https://us.i.posthog.com https://us-assets.i.posthog.com; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob: https:; font-src 'self' data:; connect-src 'self' https: https://api.stack-auth.com https://challenges.cloudflare.com https://staging-apiv3.adumoonline.com https://apiv3.adumoonline.com https://us.i.posthog.com https://us-assets.i.posthog.com; frame-src 'self' https://challenges.cloudflare.com; frame-ancestors 'none'; form-action 'self' https://staging-apiv3.adumoonline.com https://apiv3.adumoonline.com; worker-src 'self' blob:";

/** CSP for edge/proxy responses — production only (dev skips CSP for HMR). */
export function getContentSecurityPolicyHeader(): string | undefined {
  return buildContentSecurityPolicy();
}
