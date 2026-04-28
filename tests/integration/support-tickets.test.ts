/**
 * Support ticket implementation tests
 *
 * Purpose: Verify tenant users can create/list their own support tickets.
 * Location: tests/integration/support-tickets.test.ts
 */

import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { runWithTenantContext } from '@/lib/auth/tenant-context';
import { SupportTicketService } from '@/lib/services/platform/SupportTicketService';
import {
  cleanupTestData,
  createTestTenant,
  createTestUser,
} from '../utils/test-helpers';

describe('SupportTicketService tenant user flow', () => {
  let tenantId: string;
  let userId: string;
  let otherUserId: string;
  const service = new SupportTicketService();

  beforeAll(async () => {
    const tenant = await createTestTenant('Support Ticket Test Tenant');
    const user = await createTestUser(tenant.id);
    const otherUser = await createTestUser(tenant.id);
    tenantId = tenant.id;
    userId = user.id;
    otherUserId = otherUser.id;
  });

  afterAll(async () => {
    await cleanupTestData(tenantId);
  });

  it('creates an open ticket and lists only tickets for the requesting user', async () => {
    const ticket = await runWithTenantContext(tenantId, () =>
      service.createTicket({
        tenantId,
        userId,
        subject: 'Need help with payment reconciliation',
        description: 'The payout report does not match today orders total.',
        priority: 'high',
        category: 'payments',
      })
    );

    expect(ticket.id).toBeTruthy();
    expect(ticket.status).toBe('open');
    expect(ticket.priority).toBe('high');
    expect(ticket.category).toBe('payments');
    expect(ticket.user_id).toBe(userId);

    const mine = await runWithTenantContext(tenantId, () => service.listTicketsForUser(tenantId, userId));
    const others = await runWithTenantContext(tenantId, () =>
      service.listTicketsForUser(tenantId, otherUserId)
    );

    expect(mine.some((row) => row.id === ticket.id)).toBe(true);
    expect(others.some((row) => row.id === ticket.id)).toBe(false);
  });
});
