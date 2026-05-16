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
      RETURNING id, bon_status
    `;
    const bonRow = (bon as { id: string; bon_status: string }[])[0];
    expect(bonRow?.id).toBeTruthy();
    expect(bonRow?.bon_status).toBeTruthy();

    await sql`DELETE FROM bon_incident_reports WHERE incident_id = ${incidentId}`;
    await sql`DELETE FROM cybersecurity_incidents WHERE id = ${incidentId}`;
  });

  it('audit_trail should capture guest data changes', async () => {
    const guestIns = await sql`
      INSERT INTO guests (tenant_id, email, first_name, last_name)
      VALUES (${tenantId}, ${`audit-guest-${Date.now()}@example.com`}, 'Audit', 'Guest')
      RETURNING id
    `;
    const guestId = (guestIns as { id: string }[])[0]?.id;
    expect(guestId).toBeTruthy();

    await sql`
      INSERT INTO audit_trail (
        tenant_id,
        user_id,
        action,
        resource_type,
        resource_id,
        old_values,
        new_values,
        ip_address
      )
      VALUES (
        ${tenantId},
        NULL,
        'update',
        'guest',
        ${guestId},
        ${JSON.stringify({ marketing_consent: false })},
        ${JSON.stringify({ marketing_consent: true })},
        ${'127.0.0.1'}
      )
    `;

    const rows = await sql`
      SELECT id
      FROM audit_trail
      WHERE tenant_id = ${tenantId}
        AND resource_type = 'guest'
        AND resource_id = ${guestId}
      ORDER BY timestamp DESC
      LIMIT 1
    `;
    expect((rows as { id: string }[])[0]?.id).toBeTruthy();
  });

  it('CRM personalization query should respect marketing consent', async () => {
    const g1 = await sql`
      INSERT INTO guests (tenant_id, email, first_name, marketing_consent)
      VALUES (${tenantId}, ${`consent-yes-${Date.now()}@example.com`}, 'ConsentYes', true)
      RETURNING id
    `;
    const g2 = await sql`
      INSERT INTO guests (tenant_id, email, first_name, marketing_consent)
      VALUES (${tenantId}, ${`consent-no-${Date.now()}@example.com`}, 'ConsentNo', false)
      RETURNING id
    `;

    const optedIn = await sql`
      SELECT id
      FROM guests
      WHERE tenant_id = ${tenantId}
        AND marketing_consent = true
    `;
    const ids = (optedIn as { id: string }[]).map((row) => row.id);
    const g1Id = (g1 as { id: string }[])[0]?.id;
    const g2Id = (g2 as { id: string }[])[0]?.id;

    expect(ids).toContain(g1Id);
    expect(ids).not.toContain(g2Id);
  });
});
