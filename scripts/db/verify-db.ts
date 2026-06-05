/**
 * Verify database connection and Drizzle + Neon baseline tables.
 * Run: npm run test:db  (or npx tsx scripts/db/verify-db.ts)
 * Requires: DATABASE_URL in .env.local
 */

import { randomUUID } from 'node:crypto';
import { existsSync, readFileSync } from 'fs';
import { resolve } from 'path';
import { securityLogger } from '@/lib/utils/security-logger';

function loadEnv(): void {
  const root = resolve(process.cwd());
  for (const file of ['.env.local', '.env']) {
    const path = resolve(root, file);
    if (!existsSync(path)) continue;
    const content = readFileSync(path, 'utf8');
    for (const line of content.split('\n')) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const eq = trimmed.indexOf('=');
      if (eq <= 0) continue;
      const key = trimmed.slice(0, eq).trim();
      const value = trimmed.slice(eq + 1).trim().replace(/^["']|["']$/g, '');
      if (!(key in process.env)) process.env[key] = value;
    }
  }
}

async function main() {
  loadEnv();
  securityLogger.info('DATABASE_URL set:', !!process.env.DATABASE_URL);
  if (!process.env.DATABASE_URL) {
    securityLogger.error('Set DATABASE_URL in .env.local');
    process.exit(1);
  }

  const { healthCheck, sql } = await import('../../lib/db');

  securityLogger.info('\n1. Health check (SELECT NOW())...');
  const ok = await healthCheck();
  securityLogger.info(ok ? '   OK' : '   FAIL');
  if (!ok) process.exit(1);

  securityLogger.info('\n2. Raw sql SELECT 1...');
  const raw = await sql`SELECT 1 as n`;
  securityLogger.info('   Result:', raw);

  securityLogger.info('\n3. Canonical compliance baseline tables...');
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
    securityLogger.error('   MISSING tables:', missing.join(', '));
    process.exit(1);
  }
  securityLogger.info('   OK —', expected.length, 'expected baseline tables found');

  const ruleCount = await sql`SELECT count(*)::int AS c FROM fraud_detection_rules`;
  const rules = Number((ruleCount as { c: number }[])[0]?.c ?? 0);
  securityLogger.info(`\n4. fraud_detection_rules rows: ${rules}`);
  if (rules === 0) {
    securityLogger.error('   Run: psql $DATABASE_URL -f database/drizzle/0016_fraud_detection_rules_seed.sql');
    process.exit(1);
  }
  securityLogger.info('   OK');

  securityLogger.info('\nDone. Database and Drizzle baseline verification OK.');
}

main().catch((e) => {
  securityLogger.error(e);
  process.exit(1);
});
