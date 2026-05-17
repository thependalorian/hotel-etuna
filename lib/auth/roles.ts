/**
 * Role helpers — guest vs staff vs platform post-login routing.
 * Location: lib/auth/roles.ts
 */

export const GUEST_CONSUMER_ROLES = ['guest', 'user'] as const;

/** Roles allowed on /api/guest/* consumer endpoints (hub staff use dashboard APIs). */
export const GUEST_API_ROLES = [...GUEST_CONSUMER_ROLES] as const;
export const STAFF_ROLES = ['owner', 'manager', 'staff'] as const;
export const PLATFORM_ADMIN_ROLES = ['super-admin', 'admin'] as const;

export type GuestConsumerRole = (typeof GUEST_CONSUMER_ROLES)[number];

export function isGuestConsumerRole(role: string | null | undefined): boolean {
  const r = (role ?? '').toLowerCase();
  return GUEST_CONSUMER_ROLES.includes(r as GuestConsumerRole);
}

export function isStaffRole(role: string | null | undefined): boolean {
  const r = (role ?? '').toLowerCase();
  return STAFF_ROLES.includes(r as (typeof STAFF_ROLES)[number]);
}

export function isPlatformAdminRole(role: string | null | undefined): boolean {
  const r = (role ?? '').toLowerCase();
  return PLATFORM_ADMIN_ROLES.includes(r as (typeof PLATFORM_ADMIN_ROLES)[number]);
}

/** Safe in-app redirect path (no open redirects). */
export function sanitizeRedirectPath(value?: string | null): string | undefined {
  if (!value || !value.startsWith('/')) return undefined;
  if (value.startsWith('//')) return undefined;
  if (value.includes('\\') || value.includes('@')) return undefined;
  if (value.startsWith('/api')) return undefined;
  try {
    const parsed = new URL(value, 'http://localhost');
    if (parsed.hostname !== 'localhost') return undefined;
    return `${parsed.pathname}${parsed.search}${parsed.hash}`;
  } catch {
    return undefined;
  }
}

/**
 * Default landing path after login when no explicit redirect is provided.
 */
export function getDefaultPostLoginPath(role: string | null | undefined): string {
  if (isPlatformAdminRole(role)) return '/admin/platform';
  if (isStaffRole(role)) return '/dashboard';
  return '/guest';
}

/**
 * Honor ?redirect= when safe; otherwise role-based default.
 */
export function getPostLoginRedirect(
  role: string | null | undefined,
  redirectTo?: string | null,
): string {
  const safe = sanitizeRedirectPath(redirectTo);
  if (safe) return safe;
  return getDefaultPostLoginPath(role);
}
