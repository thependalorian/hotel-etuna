/**
 * CRM consent integration tests
 *
 * Purpose: Verify marketing consent changes update guests and create append-only evidence.
 * Location: tests/integration/crm-consent.test.ts
 */

import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { eq } from 'drizzle-orm';
import { db, guests } from '@/lib/db';
import { runWithTenantContext } from '@/lib/auth/tenant-context';
import { CrmConsentService } from '@/lib/services/crm/CrmConsentService';
import {
  cleanupTestData,
  createTestGuest,
  createTestTenant,
  createTestUser,
} from '../utils/test-helpers';

describe('CrmConsentService', () => {
  let tenantId: string;
  let guestId: string;
  let userId: string;
  const service = new CrmConsentService();

  beforeAll(async () => {
    const tenant = await createTestTenant('CRM Consent Test Tenant');
    const user = await createTestUser(tenant.id);
    const guest = await createTestGuest(tenant.id);
    tenantId = tenant.id;
    userId = user.id;
    guestId = guest.id;
  });

  afterAll(async () => {
    await cleanupTestData(tenantId);
  });

  it('updates guest marketing consent and records append-only evidence', async () => {
    const event = await runWithTenantContext(tenantId, () =>
      service.recordConsentChange({
        tenantId,
        guestId,
        previousMarketingConsent: false,
        newMarketingConsent: true,
        source: 'integration_test',
        reason: 'Guest opted in during profile update',
        changedByUserId: userId,
        metadata: { channel: 'dashboard' },
      })
    );

    expect(event.id).toBeTruthy();
    expect(event.previousMarketingConsent).toBe(false);
    expect(event.newMarketingConsent).toBe(true);
    expect(event.source).toBe('integration_test');

    const [guest] = await runWithTenantContext(tenantId, () =>
      db.select({ marketingConsent: guests.marketingConsent }).from(guests).where(eq(guests.id, guestId)).limit(1)
    );
    expect(guest?.marketingConsent).toBe(true);

    const events = await runWithTenantContext(tenantId, () => service.listEvents(tenantId, guestId));
    expect(events.some((row) => row.id === event.id)).toBe(true);
  });
});
