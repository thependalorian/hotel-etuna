/**
 * Audit Neon baseline (read-only)
 *
 * Purpose:
 * - Verify core production schema objects exist before/after reconciliation.
 * - Avoid destructive drift operations from `drizzle-kit push`.
 *
 * Usage:
 *   npm run db:audit:neon
 */

import { neon } from '@neondatabase/serverless';
import { securityLogger } from '@/lib/utils/security-logger';

type Row = Record<string, unknown>;

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  securityLogger.error('DATABASE_URL is not set');
  process.exit(1);
}

const sql = neon(DATABASE_URL);

async function query(label: string, q: string) {
  try {
    const rows = (await sql.query(q)) as Row[];
    securityLogger.info(`\n=== ${label} ===`);
    console.table(rows);
  } catch (error) {
    securityLogger.error(`\n=== ${label} (ERROR) ===`);
    securityLogger.error(error);
    process.exitCode = 1;
  }
}

async function main() {
  await query(
    'drizzle journal entries',
    `SELECT id, hash, created_at
     FROM drizzle.__drizzle_migrations
     ORDER BY id`,
  );

  await query(
    'bookings cash columns',
    `SELECT table_name, column_name
     FROM information_schema.columns
     WHERE table_schema='public'
       AND table_name='bookings'
       AND column_name IN ('payment_method','payment_status','amount_tendered','change_given','receipt_number')
     ORDER BY column_name`,
  );

  await query(
    'cash_reconciliations exists',
    `SELECT EXISTS (
       SELECT 1
       FROM information_schema.tables
       WHERE table_schema='public' AND table_name='cash_reconciliations'
     ) AS cash_reconciliations_exists`,
  );

  await query(
    'RLS flags',
    `SELECT c.relname AS table_name, c.relrowsecurity AS rls_enabled
     FROM pg_class c
     JOIN pg_namespace n ON n.oid = c.relnamespace
     WHERE n.nspname='public'
       AND c.relname IN ('tenants','partner_invites','bookings','guests','properties','cash_reconciliations')
     ORDER BY c.relname`,
  );
}

void main();
