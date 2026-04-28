/**
 * Compliance + fraud DB smoke (post-008b / 009b)
 *
 * Purpose: Verify Prisma TEXT-id tables accept inserts and seeded fraud rules exist per tenant.
 * Location: tests/smoke/compliance-fraud-db.smoke.test.ts
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { sql, setTenantContext, clearTenantContext } from '@/lib/db';
import { createTestTenant, cleanupTestData } from '../utils/test-helpers';

describe('Compliance & fraud DB smoke', () => {
  let tenantId: string;

  beforeAll(async () => {
    const tenant = await createTestTenant(`Smoke CF ${Date.now()}`);
    tenantId = tenant.id;
    await setTenantContext(tenantId);
  });

  afterAll(async () => {
    await cleanupTestData(tenantId);
    await clearTenantContext();
  });

  it('fraud_detection_rules table is populated (009b seed)', async () => {
    const rows = await sql`SELECT count(*)::int AS c FROM fraud_detection_rules`;
    const c = Number((rows as { c: number }[])[0]?.c ?? 0);
    expect(c).toBeGreaterThan(0);
  });

  it('inserts and deletes fraud_risk_profiles row', async () => {
    const ins = await sql`
      INSERT INTO fraud_risk_profiles (tenant_id, risk_score, risk_level, decision, detected_at)
      VALUES (${tenantId}, 5, 'low', 'approved', NOW())
      RETURNING id
    `;
    const id = (ins as { id: string }[])[0]?.id;
    expect(id).toBeTruthy();
    await sql`DELETE FROM fraud_risk_profiles WHERE id = ${id}`;
  });

  it('inserts payment_security_audit row', async () => {
    const ins = await sql`
      INSERT INTO payment_security_audit (tenant_id, payment_id, amount)
      VALUES (${tenantId}, ${'smoke-pay-' + Date.now()}, 1.00)
      RETURNING id
    `;
    const id = (ins as { id: string }[])[0]?.id;
    expect(id).toBeTruthy();
    await sql`DELETE FROM payment_security_audit WHERE id = ${id}`;
  });

  it('inserts cybersecurity_incidents + bon_incident_reports (trigger)', async () => {
    const inc = await sql`
      INSERT INTO cybersecurity_incidents (
        tenant_id, incident_reference, incident_type, severity, incident_description, detected_at
      )
      VALUES (
        ${tenantId},
        ${'SMOKE-' + Date.now()},
        'test',
        'low',
        'smoke test incident',
        NOW()
      )
      RETURNING id
    `;
    const incidentId = (inc as { id: string }[])[0]?.id;
    expect(incidentId).toBeTruthy();

    const bon = await sql`
      INSERT INTO bon_incident_reports (
        tenant_id,
        incident_id,
        report_type,
        incident_category,
        severity,
        submission_date,
        incident_summary
      )
      VALUES (
        ${tenantId},
        ${incidentId},
        'preliminary_24h',
        'test',
        'low',
        NOW(),
        'Smoke preliminary report summary for compliance validation.'
      )
      RETURNING id, psd12_compliant
    `;
    expect((bon as { id: string }[])[0]?.id).toBeTruthy();

    await sql`DELETE FROM bon_incident_reports WHERE incident_id = ${incidentId}`;
    await sql`DELETE FROM cybersecurity_incidents WHERE id = ${incidentId}`;
  });
});
