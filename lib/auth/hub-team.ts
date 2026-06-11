/**
 * Hotel Etuna hub team inboxes — maps @hoteletuna.com operators to nav + route access.
 * Location: lib/auth/hub-team.ts
 *
 * Team inboxes (contact + login): founder, admin, frontdesk, marketing, support.
 * Lodging partners use partner_admin; introducers are CRM records without login.
 */

import { brand } from '@/lib/copy/brand';

export type HubTeamInbox = 'founder' | 'admin' | 'frontdesk' | 'marketing' | 'support';

/** Canonical hub operator emails → inbox (lowercase keys). */
export const HUB_TEAM_EMAIL_TO_INBOX: Record<string, HubTeamInbox> = {
  [brand.emailFounder.toLowerCase()]: 'founder',
  [brand.emailAdmin.toLowerCase()]: 'admin',
  [brand.emailFrontDesk.toLowerCase()]: 'frontdesk',
  [brand.emailMarketing.toLowerCase()]: 'marketing',
  [brand.emailSupport.toLowerCase()]: 'support',
};

/** DB role assigned when provisioning each inbox. */
export const HUB_TEAM_INBOX_TO_ROLE: Record<HubTeamInbox, 'owner' | 'staff'> = {
  founder: 'owner',
  admin: 'owner',
  frontdesk: 'staff',
  marketing: 'staff',
  support: 'staff',
};

/** Sidebar href allowlists per inbox (prefix match for nested routes). */
const INBOX_ROUTE_PREFIXES: Record<HubTeamInbox, readonly string[]> = {
  founder: ['*'],
  admin: ['*'],
  frontdesk: [
    '/dashboard',
    '/properties',
    '/bookings',
    '/housekeeping',
    '/payments',
    '/restaurant',
    '/menu',
    '/profile',
    '/settings',
  ],
  marketing: [
    '/dashboard',
    '/crm',
    '/cms',
    '/analytics',
    '/partners',
    '/profile',
    '/settings',
  ],
  support: [
    '/dashboard',
    '/bookings',
    '/crm',
    '/ai',
    '/sofia',
    '/profile',
    '/settings',
  ],
};

const SAFE_STAFF_FALLBACK_PREFIXES = ['/dashboard', '/profile', '/settings'] as const;

export function getHubTeamInbox(email: string | null | undefined): HubTeamInbox | null {
  if (!email) return null;
  return HUB_TEAM_EMAIL_TO_INBOX[email.trim().toLowerCase()] ?? null;
}

export function isHubTeamEmail(email: string | null | undefined): boolean {
  return getHubTeamInbox(email) !== null;
}

export function hubTeamHasFullHubAccess(inbox: HubTeamInbox | null, role: string | null | undefined): boolean {
  const r = (role ?? '').toLowerCase();
  if (r === 'owner' || r === 'manager') return true;
  if (!inbox) return false;
  return inbox === 'founder' || inbox === 'admin';
}

function matchesRoutePrefix(pathname: string, prefix: string): boolean {
  if (prefix === '*') return true;
  return pathname === prefix || pathname.startsWith(`${prefix}/`);
}

export function hubTeamCanAccessRoute(
  email: string | null | undefined,
  role: string | null | undefined,
  pathname: string,
): boolean {
  const r = (role ?? '').toLowerCase();
  if (r === 'owner' || r === 'manager') return true;

  const inbox = getHubTeamInbox(email);
  if (hubTeamHasFullHubAccess(inbox, role)) return true;

  const prefixes = inbox
    ? INBOX_ROUTE_PREFIXES[inbox]
    : r === 'staff'
      ? SAFE_STAFF_FALLBACK_PREFIXES
      : [];

  return prefixes.some((p) => matchesRoutePrefix(pathname, p));
}

/** Filter dashboard sidebar hrefs for hub team staff (owners see full hub nav). */
export function hubTeamNavHrefAllowed(
  email: string | null | undefined,
  role: string | null | undefined,
  href: string,
): boolean {
  const r = (role ?? '').toLowerCase();
  if (r === 'owner' || r === 'manager') return true;

  const inbox = getHubTeamInbox(email);
  if (hubTeamHasFullHubAccess(inbox, role)) return true;

  const prefixes = inbox
    ? INBOX_ROUTE_PREFIXES[inbox]
    : r === 'staff'
      ? SAFE_STAFF_FALLBACK_PREFIXES
      : [];

  return prefixes.some((p) => href === p || (p !== '*' && href.startsWith(`${p}/`)) || (p === '*' && true));
}

export const HUB_TEAM_PROVISION_ACCOUNTS: ReadonlyArray<{
  inbox: HubTeamInbox;
  email: string;
  firstName: string;
  lastName: string;
  phone: string;
}> = [
  { inbox: 'founder', email: brand.emailFounder, firstName: 'Hotel', lastName: 'Founder', phone: '+264 81 802 4833' },
  { inbox: 'admin', email: brand.emailAdmin, firstName: 'Hotel', lastName: 'Admin', phone: '+264 81 802 4833' },
  { inbox: 'frontdesk', email: brand.emailFrontDesk, firstName: 'Front', lastName: 'Desk', phone: '+264 65 231 177' },
  { inbox: 'marketing', email: brand.emailMarketing, firstName: 'Marketing', lastName: 'Team', phone: '+264 65 231 177' },
  { inbox: 'support', email: brand.emailSupport, firstName: 'Guest', lastName: 'Support', phone: '+264 65 231 177' },
];
