/**
 * Apply all pending Neon migrations: 0029–0037
 *
 * Idempotent — uses IF NOT EXISTS and DO $$...EXCEPTION WHEN duplicate_object blocks.
 * Safe to run multiple times.
 *
 * Usage: npx tsx scripts/db/apply-pending-migrations.ts
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

async function tableExists(pool: Pool, tableName: string): Promise<boolean> {
  const { rows } = await pool.query(
    `SELECT 1 FROM information_schema.tables
     WHERE table_schema = 'public' AND table_name = $1`,
    [tableName]
  );
  return rows.length > 0;
}

async function applyMigration(
  pool: Pool,
  filename: string,
  verifyTable?: string
): Promise<{ skipped: boolean; error?: string }> {
  const filepath = resolve(process.cwd(), 'database/drizzle', filename);
  if (!existsSync(filepath)) {
    return { skipped: false, error: `File not found: ${filepath}` };
  }

  // Skip if primary verify table already exists
  if (verifyTable) {
    const exists = await tableExists(pool, verifyTable);
    if (exists) {
      console.log(`  ⏭  ${filename} — table '${verifyTable}' already exists, skipping`);
      return { skipped: true };
    }
  }

  const sql = readFileSync(filepath, 'utf8');
  try {
    await pool.query(sql);
    console.log(`  ✅ ${filename} applied`);
    return { skipped: false };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    // Tolerate "already exists" errors from idempotent DDL
    if (
      msg.includes('already exists') ||
      msg.includes('duplicate') ||
      msg.includes('already has an entry')
    ) {
      console.log(`  ℹ  ${filename} — already applied (${msg.split('\n')[0]})`);
      return { skipped: true };
    }
    return { skipped: false, error: msg };
  }
}

const PENDING_MIGRATIONS: { file: string; verifyTable?: string }[] = [
  { file: '0029_cms_pages_blocks.sql',        verifyTable: 'cms_pages' },
  { file: '0029b_cms_pages_blocks_rls.sql' },
  { file: '0031_introducer_partners.sql',     verifyTable: 'introducers' },
  { file: '0031b_introducer_partners_rls.sql' },
  { file: '0033_loyalty_transactions.sql',    verifyTable: 'loyalty_transactions' },
  { file: '0033b_loyalty_transactions_rls.sql' },
  { file: '0035_loyalty_tiers.sql',           verifyTable: 'loyalty_tiers' },
  { file: '0036_loyalty_tier_benefits.sql',   verifyTable: 'loyalty_tier_benefits' },
  { file: '0037_loyalty_auto_tier_up.sql' },
];

async function verifyPostMigration(pool: Pool): Promise<void> {
  console.log('\n📋 Post-migration verification:');
  const tables = [
    'cms_pages', 'cms_blocks',
    'introducers',
    'loyalty_transactions', 'loyalty_rewards', 'loyalty_redemptions',
    'loyalty_tiers', 'loyalty_tier_benefits',
  ];
  for (const t of tables) {
    const exists = await tableExists(pool, t);
    console.log(`  ${exists ? '✅' : '❌'} ${t}`);
  }

  // Check introducer trigger exists
  const { rows: triggers } = await pool.query(`
    SELECT trigger_name FROM information_schema.triggers
    WHERE trigger_schema = 'public'
      AND trigger_name IN ('trg_update_introducer_stats', 'trigger_auto_tier_up')
    ORDER BY trigger_name
  `);
  for (const r of triggers) {
    console.log(`  ✅ trigger: ${r.trigger_name}`);
  }

  // Count loyalty tier rows (should be seeded per tenant)
  const { rows: tierCount } = await pool.query(
    `SELECT COUNT(*) as n FROM loyalty_tiers`
  );
  console.log(`  ℹ  loyalty_tiers rows: ${tierCount[0].n}`);
}

async function main() {
  loadEnv();
  const connectionString =
    process.env.DATABASE_URL_UNPOOLED || process.env.DATABASE_URL;

  if (!connectionString) {
    console.error('❌ DATABASE_URL_UNPOOLED or DATABASE_URL must be set in .env.local');
    process.exit(1);
  }

  console.log('🚀 Applying pending Neon migrations: 0029–0037\n');

  const pool = new Pool({ connectionString, ssl: { rejectUnauthorized: false } });

  let applied = 0;
  let skipped = 0;
  let failed = 0;

  for (const { file, verifyTable } of PENDING_MIGRATIONS) {
    const result = await applyMigration(pool, file, verifyTable);
    if (result.error) {
      console.error(`  ❌ ${file}: ${result.error}`);
      failed++;
    } else if (result.skipped) {
      skipped++;
    } else {
      applied++;
    }
  }

  await verifyPostMigration(pool);

  console.log(`\n📊 Summary: ${applied} applied, ${skipped} skipped, ${failed} failed`);

  await pool.end();

  if (failed > 0) {
    process.exit(1);
  }
}

main().catch((err) => {
  console.error('Fatal:', err);
  process.exit(1);
});
