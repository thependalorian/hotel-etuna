/**
 * KYC upgrade prompt API implementation tests
 *
 * Purpose: Verify prompt actions enforce tenant ownership and write audit records.
 * Location: tests/integration/kyc-upgrade-prompts-api.test.ts
 */

import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { and, eq } from 'drizzle-orm';
import { db, auditTrail, kycUpgradePrompts } from '@/lib/db';
import { runWithTenantContext } from '@/lib/auth/tenant-context';
import {
  cleanupTestData,
  createTestGuest,
  createTestTenant,
  createTestUser,
} from '../utils/test-helpers';

const mockGetAuthenticatedUser = vi.fn();

vi.mock('@/lib/utils/api-helpers', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/utils/api-helpers')>();
  return {
    ...actual,
    getAuthenticatedUser: mockGetAuthenticatedUser,
  };
});

describe('POST /api/compliance/kyc/upgrade-prompts', () => {
  let tenantId: string;
  let userId: string;
  let guestId: string;
  let otherTenantId: string;
  let promptId: string;

  beforeAll(async () => {
    const tenant = await createTestTenant('KYC Prompt API Tenant');
    const otherTenant = await createTestTenant('KYC Prompt Other Tenant');
    const user = await createTestUser(tenant.id);
    const guest = await createTestGuest(tenant.id);

    tenantId = tenant.id;
    otherTenantId = otherTenant.id;
    userId = user.id;
    guestId = guest.id;

    const [prompt] = await runWithTenantContext(tenantId, () =>
      db
        .insert(kycUpgradePrompts)
        .values({
          tenantId,
          guestId,
          currentKycTier: 'none',
          suggestedKycTier: 'lite_kyc_individual',
          triggerReason: 'transaction_limit_threshold',
        })
        .returning()
    );
    promptId = prompt.id;
  });

  afterAll(async () => {
    await cleanupTestData(tenantId);
    await cleanupTestData(otherTenantId);
  });

  it('marks a prompt as shown and records audit trail', async () => {
    mockGetAuthenticatedUser.mockResolvedValue({
      id: userId,
      email: 'kyc-api@example.com',
      role: 'admin',
      tenantId,
    });

    const { POST } = await import('@/app/api/compliance/kyc/upgrade-prompts/route');
    const response = await POST(
      new NextRequest('http://localhost:3000/api/compliance/kyc/upgrade-prompts', {
        method: 'POST',
        body: JSON.stringify({ promptId, action: 'show' }),
        headers: { 'Content-Type': 'application/json' },
      })
    );

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.success).toBe(true);

    const [prompt] = await runWithTenantContext(tenantId, () =>
      db.select().from(kycUpgradePrompts).where(eq(kycUpgradePrompts.id, promptId)).limit(1)
    );
    expect(prompt?.isShown).toBe(true);
    expect(prompt?.shownAt).toBeTruthy();

    const audits = await runWithTenantContext(tenantId, () =>
      db
        .select()
        .from(auditTrail)
        .where(
          and(
            eq(auditTrail.tenantId, tenantId),
            eq(auditTrail.resourceType, 'kyc_upgrade_prompt'),
            eq(auditTrail.resourceId, promptId)
          )
        )
    );
    expect(audits.some((row) => row.action === 'kyc.upgrade_prompt.show')).toBe(true);
  });

  it('rejects prompt mutation from a different tenant', async () => {
    mockGetAuthenticatedUser.mockResolvedValue({
      id: userId,
      email: 'kyc-api@example.com',
      role: 'admin',
      tenantId: otherTenantId,
    });

    const { POST } = await import('@/app/api/compliance/kyc/upgrade-prompts/route');
    const response = await POST(
      new NextRequest('http://localhost:3000/api/compliance/kyc/upgrade-prompts', {
        method: 'POST',
        body: JSON.stringify({ promptId, action: 'dismiss' }),
        headers: { 'Content-Type': 'application/json' },
      })
    );

    expect(response.status).toBe(404);

    const [prompt] = await runWithTenantContext(tenantId, () =>
      db.select().from(kycUpgradePrompts).where(eq(kycUpgradePrompts.id, promptId)).limit(1)
    );
    expect(prompt?.isDismissed).toBe(false);
  });
});
