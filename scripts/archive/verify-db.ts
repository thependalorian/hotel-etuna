/**
 * Verify database connection and Drizzle + Neon implementation
 * Run: npx tsx scripts/verify-db.ts
 * Requires: DATABASE_URL in .env or .env.local
 */

import { randomUUID } from 'node:crypto';
import { readFileSync, existsSync } from 'fs';
import { resolve } from 'path';

// Load env before importing db (same as tests)
const root = resolve(process.cwd());
for (const file of ['.env.local', '.env']) {
  const path = resolve(root, file);
  if (existsSync(path)) {
    const content = readFileSync(path, 'utf8');
    for (const line of content.split('\n')) {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith('#')) {
        const eq = trimmed.indexOf('=');
        if (eq > 0) {
          const key = trimmed.slice(0, eq).trim();
          const value = trimmed.slice(eq + 1).trim().replace(/^["']|["']$/g, '');
          if (!(key in process.env)) process.env[key] = value;
        }
      }
    }
  }
}

async function main() {
  console.log('DATABASE_URL set:', !!process.env.DATABASE_URL);
  if (!process.env.DATABASE_URL) {
    console.error('Set DATABASE_URL in .env or .env.local');
    process.exit(1);
  }

  const { healthCheck, sql } = await import('../lib/db');

  // 1. Health check
  console.log('\n1. Health check (SELECT NOW())...');
  const ok = await healthCheck();
  console.log(ok ? '   OK' : '   FAIL');

  // 2. Raw query
  console.log('\n2. Raw sql SELECT 1...');
  const raw = await sql`SELECT 1 as n`;
  console.log('   Result:', raw);

  // 3. Canonical Drizzle baseline table presence.
  console.log('\n3. Canonical Drizzle baseline table presence...');
  const expected = [
    'payment_security_audit',
    'bon_incident_reports',
    'electronic_signatures',
    'record_retention_audit',
    'payment_performance_metrics',
    'cybersecurity_incidents',
    'fraud_risk_profiles',
    'fraud_alerts',
    'fraud_detection_rules',
    'support_tickets',
    'audit_trail',
    'restaurant_order_items',
  ];
  const present = await sql`
    SELECT table_name
    FROM information_schema.tables
    WHERE table_schema = 'public'
      AND table_name IN (
        'payment_security_audit',
        'bon_incident_reports',
        'electronic_signatures',
        'record_retention_audit',
        'payment_performance_metrics',
        'cybersecurity_incidents',
        'fraud_risk_profiles',
        'fraud_alerts',
        'fraud_detection_rules',
        'support_tickets',
        'audit_trail',
        'restaurant_order_items'
      )
  `;
  const names = new Set((present as { table_name: string }[]).map((r) => r.table_name));
  const missing = expected.filter((t) => !names.has(t));
  if (missing.length) {
    console.error('   MISSING tables:', missing.join(', '));
    process.exit(1);
  }
  console.log('   OK —', expected.length, 'expected baseline tables found');

  // 3a. Raw SQL insert tenant (RETURNING id, name only (no timestamp)
  console.log('\n3a. Raw SQL insert tenant (RETURNING id, name)...');
  try {
    const insertRaw = await sql`
      INSERT INTO tenants (id, name, status, created_at, updated_at)
      VALUES (${randomUUID()}, 'Verify-DB-Test', 'active', NOW(), NOW())
      RETURNING id, name
    `;
    console.log('   Raw insert OK:', insertRaw);
    if (Array.isArray(insertRaw) && insertRaw[0]) {
      await sql`DELETE FROM tenants WHERE id = ${(insertRaw[0] as { id: string }).id}`;
      console.log('   Deleted test row');
    }
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error('   Raw insert Error:', msg);
  }

  // 3a2. Raw SQL with RETURNING including created_at (timestamp)
  console.log('\n3a2. Raw SQL RETURNING id, name, created_at...');
  try {
    const withTs = await sql`
      INSERT INTO tenants (id, name, status, created_at, updated_at)
      VALUES (${randomUUID()}, 'Verify-DB-Test2', 'active', NOW(), NOW())
      RETURNING id, name, created_at
    `;
    console.log('   OK:', withTs);
    if (Array.isArray(withTs) && withTs[0]) {
      await sql`DELETE FROM tenants WHERE id = ${(withTs[0] as { id: string }).id}`;
    }
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error('   Error:', msg);
  }

  console.log('\nDone. Database and Drizzle baseline verification OK.');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
