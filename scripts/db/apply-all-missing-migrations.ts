/**
 * Apply ALL missing migrations to Neon in correct order.
 * Covers 0003–0054 with idempotency (canonical Drizzle journal + operator SQL).
 *
 * Usage: npx tsx scripts/db/apply-all-missing-migrations.ts
 */

import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { Pool } from 'pg';

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

async function columnExists(pool: Pool, table: string, column: string): Promise<boolean> {
  const { rows } = await pool.query(
    `SELECT 1 FROM information_schema.columns
     WHERE table_schema='public' AND table_name=$1 AND column_name=$2`,
    [table, column]
  );
  return rows.length > 0;
}

async function tableExists(pool: Pool, table: string): Promise<boolean> {
  const { rows } = await pool.query(
    `SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name=$1`,
    [table]
  );
  return rows.length > 0;
}

async function policyExists(pool: Pool, tableName: string, policyName: string): Promise<boolean> {
  const { rows } = await pool.query(
    `SELECT 1 FROM pg_policies WHERE tablename=$1 AND policyname=$2`,
    [tableName, policyName]
  );
  return rows.length > 0;
}

async function applyFile(pool: Pool, filename: string): Promise<void> {
  const filepath = resolve(process.cwd(), 'database/drizzle', filename);
  if (!existsSync(filepath)) throw new Error(`File not found: ${filepath}`);
  const sql = readFileSync(filepath, 'utf8');
  await pool.query(sql);
}

interface Migration {
  file: string;
  skip?: (pool: Pool) => Promise<boolean>;
  label?: string;
}

const MIGRATIONS: Migration[] = [
  {
    file: '0003_hotel_etuna_partner_network.sql',
    label: 'Partner network (tenants.type, partner_invites)',
    skip: async (p) => columnExists(p, 'tenants', 'parent_tenant_id'),
  },
  {
    file: '0004_hotel_etuna_tenant_rls_policies.sql',
    label: 'Bulk RLS on tenant tables',
    skip: async (p) => policyExists(p, 'bookings', 'tenant_access_bookings'),
  },
  {
    file: '0005_hotel_etuna_partner_constraints.sql',
    label: 'Partner check constraints (idempotent DO blocks)',
  },
  {
    file: '0006_fix_rls_recursion_with_tenant_type.sql',
    label: 'Fix RLS recursion with session vars',
  },
  {
    file: '0007_cash_payments_and_reconciliation.sql',
    label: 'Cash columns + cash_reconciliations',
    skip: async (p) => columnExists(p, 'bookings', 'payment_method'),
  },
  {
    file: '0008_reconcile_neon_baseline.sql',
    label: 'Idempotent baseline reconciliation',
  },
  {
    file: '0009_booking_charges_folio.sql',
    label: 'booking_charges folio ledger',
    skip: async (p) => tableExists(p, 'booking_charges'),
  },
  {
    file: '0010_booking_charges_rls.sql',
    label: 'RLS on booking_charges',
    skip: async (p) => policyExists(p, 'booking_charges', 'tenant_access_booking_charges'),
  },
  {
    file: '0011_fnb_inventory.sql',
    label: 'F&B inventory tables',
    skip: async (p) => tableExists(p, 'inventory_items'),
  },
  {
    file: '0012_adumo_virtual_payment_sessions.sql',
    label: 'Adumo payment_sessions',
    skip: async (p) => tableExists(p, 'payment_sessions'),
  },
  {
    file: '0013_platform_billing.sql',
    label: 'Platform billing tables + seed settlement accounts',
    skip: async (p) => tableExists(p, 'platform_invoices'),
  },
  {
    file: '0014_platform_invoice_vat.sql',
    label: 'VAT columns on platform invoices',
    skip: async (p) => columnExists(p, 'platform_invoices', 'vat_rate_percent'),
  },
  {
    file: '0015_rls_inventory_payment_sessions.sql',
    label: 'RLS for inventory + payment_sessions',
    skip: async (p) => policyExists(p, 'inventory_items', 'tenant_access_inventory_items'),
  },
  {
    file: '0016_fraud_detection_rules_seed.sql',
    label: 'Fraud detection rules seed (idempotent)',
    skip: async (p) => tableExists(p, 'fraud_detection_rules'),
  },
  {
    file: '0017_ai_conversations_tenant_session_idx.sql',
    label: 'AI conversations composite index',
  },
  {
    file: '0018_dining_reservations.sql',
    label: 'dining_reservations table',
    skip: async (p) => tableExists(p, 'dining_reservations'),
  },
  {
    file: '0019_dining_adumo_payment_sessions.sql',
    label: 'Link payment_sessions → dining_reservations',
    skip: async (p) => columnExists(p, 'payment_sessions', 'dining_reservation_id'),
  },
  {
    file: '0020_namqr_pending_confirmations.sql',
    label: 'namqr_pending_confirmations',
    skip: async (p) => tableExists(p, 'namqr_pending_confirmations'),
  },
  {
    file: '0021_housekeeping_tasks.sql',
    label: 'housekeeping_tasks + triggers',
    skip: async (p) => tableExists(p, 'housekeeping_tasks'),
  },
  {
    file: '0029_cms_pages_blocks.sql',
    label: 'cms_pages + cms_blocks',
    skip: async (p) => tableExists(p, 'cms_pages'),
  },
  {
    file: '0029b_cms_pages_blocks_rls.sql',
    label: 'RLS for CMS tables',
    skip: async (p) => policyExists(p, 'cms_pages', 'cms_pages_staff_full_access'),
  },
  {
    file: '0031_introducer_partners.sql',
    label: 'introducers + bookings.introducer_id FK',
    skip: async (p) => tableExists(p, 'introducers'),
  },
  {
    file: '0031b_introducer_partners_rls.sql',
    label: 'RLS for introducers',
    skip: async (p) => policyExists(p, 'introducers', 'introducers_tenant_isolation'),
  },
  {
    file: '0033_loyalty_transactions.sql',
    label: 'loyalty_transactions + rewards + redemptions',
    skip: async (p) => tableExists(p, 'loyalty_transactions'),
  },
  {
    file: '0033b_loyalty_transactions_rls.sql',
    label: 'RLS for loyalty tables',
    skip: async (p) => policyExists(p, 'loyalty_transactions', 'loyalty_transactions_tenant_isolation'),
  },
  {
    file: '0035_loyalty_tiers.sql',
    label: 'loyalty_tiers + seed data',
    skip: async (p) => tableExists(p, 'loyalty_tiers'),
  },
  {
    file: '0036_loyalty_tier_benefits.sql',
    label: 'loyalty_tier_benefits + seed',
    skip: async (p) => tableExists(p, 'loyalty_tier_benefits'),
  },
  {
    file: '0037_loyalty_auto_tier_up.sql',
    label: 'Auto tier-up trigger + get_guest_tier_info()',
    skip: async (p) => policyExists(p, 'loyalty_tiers', 'loyalty_tiers_tenant_isolation'),
  },
  {
    file: '0038_user_notification_preferences.sql',
    label: 'users.notification_preferences JSONB',
    skip: async (p) => columnExists(p, 'users', 'notification_preferences'),
  },
  {
    file: '0039_hotel_etuna_room_types.sql',
    label: 'Canonical room types (Standard A/B/C, Executive, Premiere)',
    skip: async (p) => {
      const r = await p.query(
        `SELECT 1 FROM rooms WHERE room_type = 'Premiere Room' LIMIT 1`,
      );
      return r.rows.length > 0;
    },
  },
  {
    file: '0040_hotel_etuna_room_inventory.sql',
    label: '35 guest rooms + retire ET-* demo rows',
    skip: async (p) => {
      const r = await p.query(
        `SELECT COUNT(*)::int AS c FROM rooms r
         JOIN properties p ON p.id = r.property_id
         WHERE p.slug = 'hotel-etuna' AND r.room_number = '5'`,
      );
      return (r.rows[0]?.c ?? 0) >= 1;
    },
  },
  {
    file: '0041_rooms_inventory_kind.sql',
    label: 'rooms.inventory_kind + facility rows',
    skip: async (p) => columnExists(p, 'rooms', 'inventory_kind'),
  },
  {
    file: '0042_bookings_service_kind.sql',
    label: 'bookings.booking_kind + pricing_details',
    skip: async (p) => columnExists(p, 'bookings', 'booking_kind'),
  },
  {
    file: '0043_facility_internal_keys.sql',
    label: 'facility internal room_number keys (not guest numbers)',
    skip: async (p) => {
      const r = await p.query(
        `SELECT COUNT(*)::int AS c FROM rooms r
         JOIN properties p ON p.id = r.property_id
         WHERE p.slug = 'hotel-etuna'
           AND r.inventory_kind IN ('conference', 'campsite')
           AND r.room_number IN ('facility:conference', 'facility:campsite')`,
      );
      return (r.rows[0]?.c ?? 0) >= 2;
    },
  },
  {
    file: '0044_schema_cleanup.sql',
    label: 'Schema cleanup (idempotent)',
  },
  {
    file: '0045_fnb_print_jobs.sql',
    label: 'F&B print dispatch jobs (kitchen ticket board)',
    skip: async (p) => tableExists(p, 'fnb_print_jobs'),
  },
  {
    file: '0046_payment_outbox_events.sql',
    label: 'Payment outbox events (transactional side effects)',
    skip: async (p) => tableExists(p, 'payment_outbox_events'),
  },
  {
    file: '0047_audit_trail_hash_chain.sql',
    label: 'Audit trail hash chain columns',
    skip: async (p) => columnExists(p, 'audit_trail', 'event_hash'),
  },
  {
    file: '0048_accounting_period_locks.sql',
    label: 'Accounting period locks',
    skip: async (p) => tableExists(p, 'accounting_period_locks'),
  },
  {
    file: '0049_durable_scheduling_notifications.sql',
    label: 'scheduler_jobs + notification_history',
    skip: async (p) => tableExists(p, 'scheduler_jobs'),
  },
  {
    file: '0050_night_audit_runs.sql',
    label: 'Night audit runs + booking_charge voided status',
    skip: async (p) => tableExists(p, 'night_audit_runs'),
  },
  {
    file: '0051_availability_ledger.sql',
    label: 'Room availability ledger',
    skip: async (p) => tableExists(p, 'room_availability_ledger'),
  },
  {
    file: '0052_sofia_pipeline_runs.sql',
    label: 'Sofia pipeline run telemetry',
    skip: async (p) => tableExists(p, 'sofia_pipeline_runs'),
  },
  {
    file: '0053_cal_booking_mirrors.sql',
    label: 'cal_booking_mirrors (Cal.com webhook mirrors)',
    skip: async (p) => tableExists(p, 'cal_booking_mirrors'),
  },
  {
    file: '0054_guest_service_requests.sql',
    label: 'Guest service & maintenance requests',
    skip: async (p) => tableExists(p, 'guest_service_requests'),
  },
  {
    file: '0055_staff_hr_extensions.sql',
    label: 'Staff HR extensions (tax, leave, timesheets, bank)',
    skip: async (p) => tableExists(p, 'staff_tax_profiles'),
  },
  {
    file: '0056_payroll_core.sql',
    label: 'Namibia payroll core tables',
    skip: async (p) => tableExists(p, 'payroll_periods'),
  },
  {
    file: '0057_staff_compensation_history.sql',
    label: 'Staff compensation history audit',
    skip: async (p) => tableExists(p, 'staff_compensation_history'),
  },
  {
    file: '0060_booking_deposit_percent.sql',
    label: 'Booking deposit_percent column',
    skip: async (p) => columnExists(p, 'bookings', 'deposit_percent'),
  },
  {
    file: '0061_payment_disputes.sql',
    label: 'Payment disputes / chargebacks',
    skip: async (p) => tableExists(p, 'payment_disputes'),
  },
  {
    file: '0062_guest_hub_magic_tokens.sql',
    label: 'Guest hub magic link tokens',
    skip: async (p) => tableExists(p, 'guest_hub_magic_tokens'),
  },
  {
    file: '0063_guest_document_vault.sql',
    label: 'Guest document vault',
    skip: async (p) => tableExists(p, 'guest_documents'),
  },
  {
    file: '0064_generated_documents.sql',
    label: 'Generated financial documents audit log',
    skip: async (p) => tableExists(p, 'generated_documents'),
  },
];

async function main() {
  loadEnv();
  const connectionString =
    process.env.DATABASE_URL_UNPOOLED || process.env.DATABASE_URL;
  if (!connectionString) {
    console.error('❌ DATABASE_URL not set');
    process.exit(1);
  }

  console.log('🚀 Applying all missing migrations to Neon...\n');
  const pool = new Pool({ connectionString, ssl: { rejectUnauthorized: false } });

  let applied = 0, skipped = 0, failed = 0;

  for (const { file, skip, label } of MIGRATIONS) {
    const name = label ?? file;
    try {
      if (skip) {
        const shouldSkip = await skip(pool);
        if (shouldSkip) {
          console.log(`  ⏭  ${file} (${name}) — already applied`);
          skipped++;
          continue;
        }
      }
      await applyFile(pool, file);
      console.log(`  ✅ ${file} — ${name}`);
      applied++;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      if (msg.includes('already exists') || msg.includes('duplicate')) {
        console.log(`  ℹ  ${file} — already applied (${msg.split('\n')[0]})`);
        skipped++;
      } else {
        console.error(`  ❌ ${file}: ${msg.split('\n')[0]}`);
        failed++;
      }
    }
  }

  // Post-migration: seed loyalty tiers for any tenants that don't have them
  console.log('\n🌱 Seeding loyalty tiers for any tenants missing them...');
  await pool.query(`
    INSERT INTO loyalty_tiers (tenant_id, tier_name, tier_order, points_threshold, earn_rate_multiplier, description)
    SELECT t.id, v.tier_name, v.tier_order::int, v.threshold::int, v.multiplier::numeric, v.description
    FROM tenants t
    CROSS JOIN (VALUES
      ('bronze',   '1', '0',    '1.00', 'Entry level - Earn 1 point per N$10 spent'),
      ('silver',   '2', '500',  '1.10', 'Silver tier - 10% bonus points + priority support'),
      ('gold',     '3', '1500', '1.25', 'Gold tier - 25% bonus points + room upgrades'),
      ('platinum', '4', '5000', '1.50', 'Platinum tier - 50% bonus points + complimentary breakfast')
    ) AS v(tier_name, tier_order, threshold, multiplier, description)
    WHERE NOT EXISTS (
      SELECT 1 FROM loyalty_tiers lt
      WHERE lt.tenant_id = t.id AND lt.tier_name = v.tier_name
    )
  `);
  const { rows: tierCount } = await pool.query('SELECT COUNT(*) n FROM loyalty_tiers');
  console.log(`  ✅ loyalty_tiers total: ${tierCount[0].n} rows`);

  // Final verification
  console.log('\n📋 Final table verification:');
  const critical = [
    'booking_charges', 'inventory_items', 'platform_invoices',
    'dining_reservations', 'housekeeping_tasks', 'cms_pages',
    'introducers', 'loyalty_transactions', 'loyalty_tiers',
    'consumer_rights_requests', 'fnb_print_jobs', 'payment_outbox_events',
    'accounting_period_locks', 'scheduler_jobs', 'night_audit_runs',
    'room_availability_ledger', 'sofia_pipeline_runs', 'cal_booking_mirrors',
    'guest_service_requests',
    'guest_hub_magic_tokens',
    'guest_documents',
    'generated_documents',
  ];
  for (const t of critical) {
    const exists = await tableExists(pool, t);
    console.log(`  ${exists ? '✅' : '❌'} ${t}`);
  }

  console.log(`\n📊 Summary: ${applied} applied, ${skipped} already done, ${failed} failed`);
  await pool.end();
  if (failed > 0) process.exit(1);
}

main().catch((err) => { console.error('Fatal:', err); process.exit(1); });
