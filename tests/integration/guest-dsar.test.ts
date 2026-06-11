/**
 * Guest DSAR API integration — schema + persistence path
 * Location: tests/integration/guest-dsar.test.ts
 */

import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { db } from '@/lib/db';
import { consumerRightsRequests, guests } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { runWithTenantContext } from '@/lib/auth/tenant-context';
import {
  cleanupTestData,
  createTestGuest,
  createTestTenant,
} from '../utils/test-helpers';

const hasDatabase = Boolean(process.env.DATABASE_URL || process.env.TEST_DATABASE_URL);

describe.skipIf(!hasDatabase)('Guest DSAR persistence', () => {
  let tenantId: string;
  let guestId: string;
  const guestEmail = `dsar-guest-${Date.now()}@example.com`;

  beforeAll(async () => {
    const tenant = await createTestTenant('DSAR Integration Tenant');
    tenantId = tenant.id;
    const guest = await createTestGuest(tenant.id, guestEmail);
    guestId = guest.id;
  });

  afterAll(async () => {
    await cleanupTestData(tenantId);
  });

  it('inserts a consumer rights request linked to guest tenant', async () => {
    const requestReference = `DSAR-TEST-${Date.now()}`;
    const requestDate = new Date().toISOString().slice(0, 10);

    await runWithTenantContext(tenantId, async () => {
      const [row] = await db
        .insert(consumerRightsRequests)
        .values({
          tenantId,
          accountHolderId: guestId,
          requestType: 'access',
          requestDescription: 'Integration test: please provide my stay history.',
          requestReference,
          requestDate,
          status: 'pending',
        })
        .returning({ id: consumerRightsRequests.id, requestReference: consumerRightsRequests.requestReference });

      expect(row?.requestReference).toBe(requestReference);

      const [guestRow] = await db
        .select({ id: guests.id })
        .from(guests)
        .where(eq(guests.id, guestId))
        .limit(1);
      expect(guestRow?.id).toBe(guestId);
    });
  });
});
