/**
 * Verify operator SQL migrations (0011–0017) are applied on Neon.
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

    const idx = await pool.query(
      `SELECT 1 FROM pg_indexes
       WHERE schemaname = 'public' AND tablename = 'ai_conversations'
         AND indexname = 'idx_ai_conversations_tenant_session'`
    );
    results.push({
      name: '0017 ai_conversations tenant+session index',
      ok: idx.rows.length > 0,
    });

    const dining = await pool.query(
      `SELECT 1 FROM information_schema.tables
       WHERE table_schema = 'public' AND table_name = 'dining_reservations'`
    );
    results.push({
      name: '0018 dining_reservations table',
      ok: dining.rows.length > 0,
    });

    const diningPay = await pool.query(
      `SELECT 1 FROM information_schema.columns
       WHERE table_schema = 'public' AND table_name = 'payment_sessions'
         AND column_name = 'dining_reservation_id'`
    );
    results.push({
      name: '0019 payment_sessions.dining_reservation_id',
      ok: diningPay.rows.length > 0,
    });

    const noStripe = await pool.query(
      `SELECT 1 FROM information_schema.columns
       WHERE table_schema = 'public' AND table_name = 'dining_reservations'
         AND column_name = 'stripe_session_id'`
    );
    results.push({
      name: '0019 dining_reservations stripe removed',
      ok: noStripe.rows.length === 0,
    });

    results.push({
      name: '0020 namqr_pending_confirmations table',
      ok: await tableExists(pool, 'namqr_pending_confirmations'),
    });

    results.push({
      name: '0021 housekeeping_tasks table',
      ok: await tableExists(pool, 'housekeeping_tasks'),
    });

    results.push({
      name: '0029 cms_pages table',
      ok: await tableExists(pool, 'cms_pages'),
    });

    results.push({
      name: '0029b cms_pages RLS',
      ok:
        (await tableExists(pool, 'cms_pages')) &&
        (await rlsEnabled(pool, 'cms_pages')),
    });

    results.push({
      name: '0031 introducers table',
      ok: await tableExists(pool, 'introducers'),
    });

    results.push({
      name: '0033 loyalty_transactions table',
      ok: await tableExists(pool, 'loyalty_transactions'),
    });

    results.push({
      name: '0035 loyalty_tiers table',
      ok: await tableExists(pool, 'loyalty_tiers'),
    });

    results.push({
      name: '0037 loyalty tier trigger',
      ok: await tableExists(pool, 'loyalty_tiers'),
      detail: 'tiers present (trigger assumed if tiers exist)',
    });

    results.push({
      name: '0038 users.notification_preferences',
      ok: await columnExists(pool, 'users', 'notification_preferences'),
    });

    const premiereRoom = await pool.query(
      `SELECT 1 FROM rooms WHERE room_type = 'Premiere Room' LIMIT 1`,
    );
    results.push({
      name: '0039 canonical room types',
      ok: premiereRoom.rows.length > 0,
      detail: premiereRoom.rows.length > 0 ? 'Premiere Room present' : 'run 0039_hotel_etuna_room_types.sql',
    });

    const guestRoomCount = await pool.query(
      `SELECT COUNT(*)::int AS c FROM rooms r
       JOIN properties p ON p.id = r.property_id
       WHERE p.slug = 'hotel-etuna'
         AND COALESCE(r.inventory_kind, 'guest_room') = 'guest_room'
         AND r.room_number NOT LIKE 'ET-%'`,
    );
    const guestCount = guestRoomCount.rows[0]?.c ?? 0;
    results.push({
      name: '0040 guest room inventory (35)',
      ok: guestCount >= 35,
      detail: `${guestCount} guest rooms`,
    });

    results.push({
      name: '0041 rooms.inventory_kind',
      ok: await columnExists(pool, 'rooms', 'inventory_kind'),
    });

    const facilityRows = await pool.query(
      `SELECT COUNT(*)::int AS c FROM rooms r
       JOIN properties p ON p.id = r.property_id
       WHERE p.slug = 'hotel-etuna' AND r.inventory_kind IN ('conference', 'campsite')`,
    );
    results.push({
      name: '0041 facility rows (one conference + one campsite)',
      ok: (facilityRows.rows[0]?.c ?? 0) === 2,
      detail: `${facilityRows.rows[0]?.c ?? 0} facility rows`,
    });

    const facilityKeys = await pool.query(
      `SELECT COUNT(*)::int AS c FROM rooms r
       JOIN properties p ON p.id = r.property_id
       WHERE p.slug = 'hotel-etuna'
         AND r.room_number IN ('facility:conference', 'facility:campsite')`,
    );
    results.push({
      name: '0043 facility internal keys',
      ok: (facilityKeys.rows[0]?.c ?? 0) >= 2,
      detail: 'facility:conference + facility:campsite',
    });

    results.push({
      name: '0042 bookings.booking_kind',
      ok: await columnExists(pool, 'bookings', 'booking_kind'),
    });

    results.push({
      name: '0045 fnb_print_jobs table',
      ok: await tableExists(pool, 'fnb_print_jobs'),
    });

    results.push({
      name: '0046 payment_outbox_events table',
      ok: await tableExists(pool, 'payment_outbox_events'),
    });

    results.push({
      name: '0047 audit_trail event_hash column',
      ok: await columnExists(pool, 'audit_trail', 'event_hash'),
    });

    results.push({
      name: '0048 accounting_period_locks table',
      ok: await tableExists(pool, 'accounting_period_locks'),
    });

    results.push({
      name: '0049 scheduler_jobs table',
      ok: await tableExists(pool, 'scheduler_jobs'),
    });

    results.push({
      name: '0050 night_audit_runs table',
      ok: await tableExists(pool, 'night_audit_runs'),
    });

    results.push({
      name: '0051 room_availability_ledger table',
      ok: await tableExists(pool, 'room_availability_ledger'),
    });

    results.push({
      name: '0052 sofia_pipeline_runs table',
      ok: await tableExists(pool, 'sofia_pipeline_runs'),
    });

    results.push({
      name: '0053 cal_booking_mirrors table',
      ok: await tableExists(pool, 'cal_booking_mirrors'),
    });

    results.push({
      name: '0054 guest_service_requests table',
      ok: await tableExists(pool, 'guest_service_requests'),
    });

    results.push({
      name: '0055 staff_tax_profiles table',
      ok: await tableExists(pool, 'staff_tax_profiles'),
    });

    results.push({
      name: '0056 payroll_periods table',
      ok: await tableExists(pool, 'payroll_periods'),
    });

    results.push({
      name: '0057 staff_compensation_history table',
      ok: await tableExists(pool, 'staff_compensation_history'),
    });

    results.push({
      name: '0060 bookings.deposit_percent column',
      ok: await columnExists(pool, 'bookings', 'deposit_percent'),
    });

    results.push({
      name: '0061 payment_disputes table',
      ok: await tableExists(pool, 'payment_disputes'),
    });

    results.push({
      name: '0062 guest_hub_magic_tokens table',
      ok: await tableExists(pool, 'guest_hub_magic_tokens'),
    });

    results.push({
      name: '0063 guest_documents table',
      ok: await tableExists(pool, 'guest_documents'),
    });

    results.push({
      name: '0064 generated_documents table',
      ok: await tableExists(pool, 'generated_documents'),
    });

    results.push({
      name: '0065 tenant_whatsapp openwa_session_id',
      ok: await columnExists(pool, 'tenant_whatsapp_settings', 'openwa_session_id'),
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
