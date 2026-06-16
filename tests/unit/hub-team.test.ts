import { describe, expect, it } from 'vitest';
import {
  getHubTeamInbox,
  hubTeamCanAccessRoute,
  hubTeamNavHrefAllowed,
  HUB_TEAM_INBOX_TO_ROLE,
} from '@/lib/auth/hub-team';

describe('hub-team', () => {
  it('maps canonical @hoteletuna.com inboxes', () => {
    expect(getHubTeamInbox('founder@hoteletuna.com')).toBe('founder');
    expect(getHubTeamInbox('frontdesk@hoteletuna.com')).toBe('frontdesk');
    expect(HUB_TEAM_INBOX_TO_ROLE.marketing).toBe('staff');
    expect(HUB_TEAM_INBOX_TO_ROLE.founder).toBe('owner');
  });

  it('frontdesk can reach payments desk but not CRM', () => {
    expect(hubTeamCanAccessRoute('frontdesk@hoteletuna.com', 'staff', '/payments/desk')).toBe(true);
    expect(hubTeamCanAccessRoute('frontdesk@hoteletuna.com', 'staff', '/crm/introducers')).toBe(false);
  });

  it('marketing can reach introducers CRM but not payments desk', () => {
    expect(hubTeamCanAccessRoute('marketing@hoteletuna.com', 'staff', '/crm/introducers')).toBe(true);
    expect(hubTeamCanAccessRoute('marketing@hoteletuna.com', 'staff', '/payments/desk')).toBe(false);
  });

  it('owner role always has full hub routes', () => {
    expect(hubTeamCanAccessRoute('admin@hoteletuna.com', 'owner', '/payments/desk')).toBe(true);
    expect(hubTeamNavHrefAllowed('admin@hoteletuna.com', 'owner', '/crm')).toBe(true);
  });

  it('support can reach Sofia surfaces', () => {
    expect(hubTeamCanAccessRoute('support@hoteletuna.com', 'staff', '/sofia/email')).toBe(true);
    expect(hubTeamCanAccessRoute('support@hoteletuna.com', 'staff', '/payments/reconciliation')).toBe(false);
  });

  it('frontdesk and support can reach communications hub', () => {
    expect(hubTeamCanAccessRoute('frontdesk@hoteletuna.com', 'staff', '/communications')).toBe(true);
    expect(hubTeamCanAccessRoute('support@hoteletuna.com', 'staff', '/communications/wa:tenant:264')).toBe(true);
    expect(hubTeamCanAccessRoute('marketing@hoteletuna.com', 'staff', '/communications')).toBe(false);
  });
});
