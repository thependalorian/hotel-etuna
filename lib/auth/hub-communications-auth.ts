/**
 * Hub communications API auth — front desk, support, founder, admin.
 * Location: lib/auth/hub-communications-auth.ts
 */

import type { NextRequest } from 'next/server';
import { getHubTeamInbox, hubTeamHasFullHubAccess, type HubTeamInbox } from '@/lib/auth/hub-team';
import { getAuthenticatedUser } from '@/lib/utils/api-helpers';

const COMMUNICATIONS_INBOXES: readonly HubTeamInbox[] = [
  'founder',
  'admin',
  'frontdesk',
  'support',
];

export type HubCommunicationsUser = {
  id: string;
  email: string;
  tenantId: string;
  role: string;
  inbox: HubTeamInbox | null;
};

export async function requireHubCommunicationsUser(
  req?: NextRequest
): Promise<HubCommunicationsUser | null> {
  const user = await getAuthenticatedUser(req);
  if (!user?.id || !user.tenantId || !user.email) {
    return null;
  }

  const inbox = getHubTeamInbox(user.email);
  const role = user.role ?? 'user';

  if (hubTeamHasFullHubAccess(inbox, role)) {
    return {
      id: user.id,
      email: user.email,
      tenantId: user.tenantId,
      role,
      inbox,
    };
  }

  if (inbox && COMMUNICATIONS_INBOXES.includes(inbox)) {
    return {
      id: user.id,
      email: user.email,
      tenantId: user.tenantId,
      role,
      inbox,
    };
  }

  if (role === 'owner' || role === 'manager' || role === 'admin') {
    return {
      id: user.id,
      email: user.email,
      tenantId: user.tenantId,
      role,
      inbox,
    };
  }

  return null;
}
