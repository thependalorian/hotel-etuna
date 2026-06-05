/**
 * Seed loyalty tier definitions for all hub tenants.
 * Safe to run multiple times (ON CONFLICT DO NOTHING).
 *
 * Usage: npx tsx scripts/db/seed-loyalty-tiers.ts
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

const TIERS = [
  { name: 'bronze',   order: 1, threshold: 0,    multiplier: '1.00', description: 'Entry level — Earn 1 point per N$10 spent' },
  { name: 'silver',   order: 2, threshold: 500,   multiplier: '1.10', description: 'Silver tier — Earn 10% bonus points + priority support' },
  { name: 'gold',     order: 3, threshold: 1500,  multiplier: '1.25', description: 'Gold tier — Earn 25% bonus points + room upgrades + late checkout' },
  { name: 'platinum', order: 4, threshold: 5000,  multiplier: '1.50', description: 'Platinum tier — Earn 50% bonus points + complimentary breakfast + suite upgrades' },
];

async function main() {
  loadEnv();
  const connectionString =
    process.env.DATABASE_URL_UNPOOLED || process.env.DATABASE_URL;
  if (!connectionString) {
    console.error('❌ DATABASE_URL not set');
    process.exit(1);
  }

  const pool = new Pool({ connectionString, ssl: { rejectUnauthorized: false } });

  try {
    // Get all tenants
    const { rows: tenants } = await pool.query<{ id: string; name: string }>(
      `SELECT id, name FROM tenants ORDER BY created_at`
    );
    console.log(`Found ${tenants.length} tenant(s)`);

    for (const tenant of tenants) {
      let inserted = 0;
      let skipped = 0;
      for (const tier of TIERS) {
        const { rowCount } = await pool.query(
          `INSERT INTO loyalty_tiers
             (tenant_id, tier_name, tier_order, points_threshold, earn_rate_multiplier, description)
           VALUES ($1, $2, $3, $4, $5, $6)
           ON CONFLICT (tenant_id, tier_name) DO NOTHING`,
          [tenant.id, tier.name, tier.order, tier.threshold, tier.multiplier, tier.description]
        );
        if ((rowCount ?? 0) > 0) inserted++;
        else skipped++;
      }
      console.log(`  ✅ ${tenant.name}: ${inserted} inserted, ${skipped} already exist`);
    }

    const { rows: count } = await pool.query('SELECT COUNT(*) AS n FROM loyalty_tiers');
    console.log(`\n✅ loyalty_tiers total rows: ${count[0].n}`);
  } finally {
    await pool.end();
  }
}

main().catch((err) => {
  console.error('Fatal:', err);
  process.exit(1);
});
