/**
 * Integration test for audit hash chain verification API.
 * Tests /api/compliance/audit-chain/verify endpoint with real DB.
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { db, auditTrail } from '@/lib/db';
import { randomUUID } from 'node:crypto';
import { recordAuditTrail } from '@/lib/compliance/record-audit';
import { auditHashService, ZERO_HASH } from '@/lib/compliance/AuditHashService';
import { sql as rawSql } from 'drizzle-orm';
import { createTestTenant, createTestUser, cleanupTestData } from '../utils/test-helpers';

describe('audit chain verify API (integration)', () => {
  let testTenantId: string;
  let testUserId: string;

  beforeAll(async () => {
    const tenant = await createTestTenant('Audit Chain Test Tenant');
    testTenantId = tenant.id;
    const user = await createTestUser(testTenantId);
    testUserId = user.id;

    await db.execute(rawSql`
      DELETE FROM ${auditTrail}
      WHERE tenant_id = ${testTenantId}::uuid
    `);
  });

  afterAll(async () => {
    await db.execute(rawSql`
      DELETE FROM ${auditTrail}
      WHERE tenant_id = ${testTenantId}::uuid
    `);
    await cleanupTestData(testTenantId);
  });

  it('verifies a valid hash chain after inserting records', async () => {
    await recordAuditTrail({
      tenantId: testTenantId,
      userId: testUserId,
      action: 'booking.created',
      resourceType: 'booking',
      resourceId: randomUUID(),
      newValues: { status: 'pending' },
    });

    await recordAuditTrail({
      tenantId: testTenantId,
      userId: testUserId,
      action: 'booking.confirmed',
      resourceType: 'booking',
      resourceId: randomUUID(),
      newValues: { status: 'confirmed' },
    });

    await recordAuditTrail({
      tenantId: testTenantId,
      userId: testUserId,
      action: 'payment.received',
      resourceType: 'payment',
      resourceId: randomUUID(),
      newValues: { amount: 1000 },
    });

    const result = await auditHashService.verifyChain(testTenantId);

    expect(result.valid).toBe(true);
    expect(result.hashedEventsChecked).toBeGreaterThanOrEqual(3);
    expect(result.tamperedEventId).toBeNull();
    expect(result.tamperedReason).toBeNull();
    expect(result.tenantId).toBe(testTenantId);
  });

  it('detects tampering when event hash is modified', async () => {
    const resourceId = randomUUID();
    await recordAuditTrail({
      tenantId: testTenantId,
      userId: testUserId,
      action: 'test.tamper',
      resourceType: 'test',
      resourceId,
      newValues: { value: 'original' },
    });

    const rows = await db
      .select({ id: auditTrail.id })
      .from(auditTrail)
      .where(rawSql`tenant_id = ${testTenantId}::uuid AND resource_id = ${resourceId}::uuid`)
      .limit(1);

    expect(rows.length).toBe(1);
    const tamperTargetId = rows[0]!.id;

    await db.execute(rawSql`
      UPDATE ${auditTrail}
      SET event_hash = '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef'
      WHERE id = ${tamperTargetId}::uuid
    `);

    const result = await auditHashService.verifyChain(testTenantId);

    expect(result.valid).toBe(false);
    expect(result.tamperedEventId).toBe(tamperTargetId);
    expect(result.tamperedReason).toBe('event_hash_mismatch');
  });

  it('detects tampering when previous hash is modified', async () => {
    await db.execute(rawSql`
      DELETE FROM ${auditTrail}
      WHERE tenant_id = ${testTenantId}::uuid
    `);

    await recordAuditTrail({
      tenantId: testTenantId,
      userId: testUserId,
      action: 'chain.link1',
      resourceType: 'test',
      resourceId: randomUUID(),
    });

    const link2ResourceId = randomUUID();
    await recordAuditTrail({
      tenantId: testTenantId,
      userId: testUserId,
      action: 'chain.link2',
      resourceType: 'test',
      resourceId: link2ResourceId,
    });

    const rows = await db
      .select({ id: auditTrail.id })
      .from(auditTrail)
      .where(rawSql`tenant_id = ${testTenantId}::uuid AND resource_id = ${link2ResourceId}::uuid`)
      .limit(1);

    expect(rows.length).toBe(1);
    const link2Id = rows[0]!.id;

    await db.execute(rawSql`
      UPDATE ${auditTrail}
      SET previous_hash = ${ZERO_HASH}
      WHERE id = ${link2Id}::uuid
    `);

    const result = await auditHashService.verifyChain(testTenantId);

    expect(result.valid).toBe(false);
    expect(result.tamperedEventId).toBe(link2Id);
    expect(result.tamperedReason).toBe('previous_hash_mismatch');
  });

  it('skips legacy rows without hashes', async () => {
    await db.execute(rawSql`
      DELETE FROM ${auditTrail}
      WHERE tenant_id = ${testTenantId}::uuid
    `);

    await db.execute(rawSql`
      INSERT INTO ${auditTrail} (
        id, tenant_id, user_id, action, resource_type, timestamp
      ) VALUES (
        gen_random_uuid(),
        ${testTenantId}::uuid,
        NULL,
        'legacy.action',
        'legacy',
        NOW()
      )
    `);

    await recordAuditTrail({
      tenantId: testTenantId,
      userId: testUserId,
      action: 'modern.action',
      resourceType: 'modern',
      resourceId: randomUUID(),
    });

    const result = await auditHashService.verifyChain(testTenantId);

    expect(result.valid).toBe(true);
    expect(result.unhashedEventsSkipped).toBeGreaterThanOrEqual(1);
    expect(result.hashedEventsChecked).toBeGreaterThanOrEqual(1);
  });
});
