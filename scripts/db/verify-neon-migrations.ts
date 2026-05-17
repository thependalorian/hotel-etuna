/**
 * Verify operator SQL migrations (0011–0016) are applied on Neon.
 *
 * Purpose: Read-only checks for payment, billing, inventory, and RLS posture.
 * Location: /scripts/db/verify-neon-migrations.ts
 *
 * Run:
 *   npx tsx scripts/db/verify-neon-migrations.ts
 */

import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { Pool } from 'pg';

type CheckResult = { name: string; ok: boolean; detail?: string };

function loadEnv(): void {
  const root = resolve(process.cwd());
  for (const file of ['.env.local', '.env']) {
    const path = resolve(root, file);
    if (!existsSync(path)) continue;
    const content = readFileSync(path, 'utf8');
    for (const line of content.split('\n')) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const idx = trimmed.indexOf('=');
      if (idx <= 0) continue;
      const key = trimmed.slice(0, idx).trim();
      const value = trimmed.slice(idx + 1).trim().replace(/^["']|["']$/g, '');
      if (!(key in process.env)) process.env[key] = value;
    }
  }
}

async function tableExists(pool: Pool, table: string): Promise<boolean> {
  const { rows } = await pool.query(
    `SELECT 1 FROM information_schema.tables
     WHERE table_schema = 'public' AND table_name = $1`,
    [table]
  );
  return rows.length > 0;
}

async function rlsEnabled(pool: Pool, table: string): Promise<boolean> {
  const { rows } = await pool.query(
    `SELECT relrowsecurity FROM pg_class c
     JOIN pg_namespace n ON n.oid = c.relnamespace
     WHERE n.nspname = 'public' AND c.relname = $1`,
    [table]
  );
  return rows[0]?.relrowsecurity === true;
}

async function hasPolicy(pool: Pool, table: string, policy: string): Promise<boolean> {
  const { rows } = await pool.query(
    `SELECT 1 FROM pg_policies
     WHERE schemaname = 'public' AND tablename = $1 AND policyname = $2`,
    [table, policy]
  );
  return rows.length > 0;
}

async function columnExists(
  pool: Pool,
  table: string,
  column: string
): Promise<boolean> {
  const { rows } = await pool.query(
    `SELECT 1 FROM information_schema.columns
     WHERE table_schema = 'public' AND table_name = $1 AND column_name = $2`,
    [table, column]
  );
  return rows.length > 0;
}

function report(results: CheckResult[]): void {
  let failed = 0;
  for (const r of results) {
    if (r.ok) {
      console.log(`✅ ${r.name}${r.detail ? ` — ${r.detail}` : ''}`);
    } else {
      failed += 1;
      console.log(`❌ ${r.name}${r.detail ? ` — ${r.detail}` : ''}`);
    }
  }
  console.log('');
  if (failed > 0) {
    console.log(
      `Failed ${failed}/${results.length} checks. Apply SQL under database/drizzle/ (see TASK.md § Neon operator migrations).`
    );
    process.exit(1);
  }
  console.log(`All ${results.length} migration checks passed.`);
}

async function main() {
  loadEnv();
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    console.error('❌ DATABASE_URL is not set in .env.local or .env');
    process.exit(1);
  }

  const pool = new Pool({ connectionString: databaseUrl });
  const results: CheckResult[] = [];

  try {
    const tables0011 = [
      'inventory_items',
      'menu_item_inventory_links',
      'stock_movements',
      'stock_alerts',
    ];
    for (const t of tables0011) {
      results.push({
        name: `0011 table ${t}`,
        ok: await tableExists(pool, t),
        detail: t,
      });
    }

    results.push({
      name: '0012 table payment_sessions',
      ok: await tableExists(pool, 'payment_sessions'),
    });

    const tables0013 = [
      'settlement_accounts',
      'platform_fee_schedules',
      'platform_fee_accruals',
      'platform_invoices',
      'platform_invoice_lines',
    ];
    for (const t of tables0013) {
      results.push({
        name: `0013 table ${t}`,
        ok: await tableExists(pool, t),
      });
    }

    results.push({
      name: '0014 platform_invoices.vat_rate_percent',
      ok: await columnExists(pool, 'platform_invoices', 'vat_rate_percent'),
    });

    const rlsTables: Array<{ table: string; policy: string }> = [
      { table: 'booking_charges', policy: 'tenant_access_booking_charges' },
      { table: 'inventory_items', policy: 'tenant_access_inventory_items' },
      { table: 'payment_sessions', policy: 'tenant_access_payment_sessions' },
      { table: 'stock_movements', policy: 'tenant_access_stock_movements' },
    ];

    for (const { table, policy } of rlsTables) {
      const exists = await tableExists(pool, table);
      if (!exists) {
        results.push({ name: `RLS ${table}`, ok: false, detail: 'table missing' });
        continue;
      }
      const rls = await rlsEnabled(pool, table);
      const pol = await hasPolicy(pool, table, policy);
      results.push({
        name: `RLS ${table}`,
        ok: rls && pol,
        detail: rls
          ? pol
            ? policy
            : `RLS on but missing policy ${policy} (run 0015)`
          : 'RLS not enabled (run 0015 or 0010)',
      });
    }

    results.push({
      name: 'bookings.folio_closed_at',
      ok: await columnExists(pool, 'bookings', 'folio_closed_at'),
    });

    const fraudRules = await pool.query(
      `SELECT count(*)::int AS c FROM fraud_detection_rules`
    );
    const ruleCount = Number(fraudRules.rows[0]?.c ?? 0);
    results.push({
      name: '0016 fraud_detection_rules seed',
      ok: ruleCount > 0,
      detail: `${ruleCount} rows`,
    });
  } finally {
    await pool.end();
  }

  report(results);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
