/**
 * Public site base URL — guest links, QR deep links, platform defaults.
 * Location: lib/utils/public-app-url.ts
 */

const DEFAULT_PUBLIC_APP_URL = 'https://www.hoteletuna.com';

/** Canonical origin for guest-facing deep links (no trailing slash). */
export function getPublicAppUrl(): string {
  const raw =
    (typeof process !== 'undefined' && process.env.NEXT_PUBLIC_APP_URL?.trim()) ||
    DEFAULT_PUBLIC_APP_URL;
  return raw.replace(/\/$/, '');
}
