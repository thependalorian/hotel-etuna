/**
 * Public API URL helper — consistent `/api/v1/...` versioning for app-facing REST routes.
 *
 * Purpose: Single entry for browser/server fetches; integrates with next.config rewrites.
 * Location: /lib/utils/api-url.ts
 *
 * Unversioned (framework / infra / OAuth callbacks): `/api/auth`, `/api/webhooks`, `/api/cron`, `/api/debug`
 */

const DEFAULT_PREFIX = '/api/v1';

/** From env for dashboards that embed a different stage (defaults to `/api/v1`). */
export function getApiPublicPrefix(): string {
  if (typeof process !== 'undefined' && process.env.NEXT_PUBLIC_API_PREFIX) {
    const p = process.env.NEXT_PUBLIC_API_PREFIX.trim();
    return p.endsWith('/') ? p.slice(0, -1) : p;
  }
  return DEFAULT_PREFIX;
}

const UNVERSIONED_PREFIXES = ['/api/auth', '/api/webhooks', '/api/cron', '/api/debug'] as const;

function toFullApiPath(path: string): string {
  let p = path.trim();
  if (!p.startsWith('/')) p = `/${p}`;
  return p.startsWith('/api') ? p : `/api${p}`;
}

function isUnversioned(fullPath: string): boolean {
  return UNVERSIONED_PREFIXES.some((prefix) => fullPath === prefix || fullPath.startsWith(`${prefix}/`));
}

/**
 * Build a versioned client URL. Accepts `properties`, `/properties`, or `/api/properties`.
 * Auth, webhooks, cron, and debug stay on `/api/...`.
 */
export function apiUrl(path: string): string {
  const full = toFullApiPath(path);
  if (isUnversioned(full)) return full;
  const prefix = getApiPublicPrefix();
  if (full.startsWith(`${prefix}/`) || full === prefix) return full;
  return `${prefix}${full.slice('/api'.length)}`;
}

/**
 * Strip `/api/v1` for server-side logic that matches legacy path keys (rate limits, docs).
 */
export function normalizePathnameForRateLimit(pathname: string): string {
  const prefix = getApiPublicPrefix();
  if (prefix !== '/api/v1') {
    if (pathname.startsWith(`${prefix}/`)) {
      return `/api/${pathname.slice(prefix.length + 1)}`;
    }
    if (pathname === prefix) return '/api';
    return pathname;
  }
  if (pathname.startsWith('/api/v1/')) return `/api/${pathname.slice('/api/v1/'.length)}`;
  if (pathname === '/api/v1') return '/api';
  return pathname;
}
