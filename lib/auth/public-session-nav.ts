/**
 * Public-site nav helpers from NextAuth session role.
 * Location: lib/auth/public-session-nav.ts
 */

import { getHubTeamInbox } from '@/lib/auth/hub-team';

export function getSignedInAccountHref(role?: string | null, email?: string | null): string {
  const r = (role ?? '').toLowerCase();
  if (r === 'super-admin' || r === 'admin') return '/admin/platform';
  if (r.startsWith('partner')) return '/partner/dashboard';
  if (r === 'owner' || r === 'manager' || r === 'staff') {
    return '/dashboard';
  }
  return '/guest';
}

export function getSignedInAccountLabel(role?: string | null, email?: string | null): string {
  const r = (role ?? '').toLowerCase();
  if (r === 'super-admin' || r === 'admin') return 'Platform';
  if (r.startsWith('partner')) return 'Partner portal';
  const inbox = getHubTeamInbox(email);
  if (inbox === 'frontdesk') return 'Front desk';
  if (inbox === 'marketing') return 'Marketing';
  if (inbox === 'support') return 'Support';
  if (inbox === 'founder' || inbox === 'admin' || r === 'owner' || r === 'manager') {
    return 'Dashboard';
  }
  if (r === 'staff') return 'Dashboard';
  return 'My stay';
}

export function isDisposableTestEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  const lower = email.toLowerCase();
  return lower.endsWith('@example.com') || lower.endsWith('@test.com');
}
