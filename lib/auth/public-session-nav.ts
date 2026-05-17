/**
 * Public-site nav helpers from NextAuth session role.
 * Location: lib/auth/public-session-nav.ts
 */

export function getSignedInAccountHref(role?: string | null): string {
  const r = (role ?? '').toLowerCase();
  if (r === 'super-admin' || r === 'admin') return '/admin/platform';
  if (r === 'owner' || r === 'manager' || r === 'staff') return '/dashboard';
  return '/guest';
}

export function getSignedInAccountLabel(role?: string | null): string {
  const r = (role ?? '').toLowerCase();
  if (r === 'super-admin' || r === 'admin') return 'Platform';
  if (r === 'owner' || r === 'manager' || r === 'staff') return 'Dashboard';
  return 'My stay';
}

export function isDisposableTestEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  const lower = email.toLowerCase();
  return lower.endsWith('@example.com') || lower.endsWith('@test.com');
}
