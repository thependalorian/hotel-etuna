/**
 * Apply loyalty system migrations (0033–0037) to Neon database.
 *
 * Usage: npx tsx scripts/db/apply-loyalty-migrations.ts
 */

import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { Pool } from 'pg';
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
      const idx = trimmed.indexOf('=');
      if (idx <= 0) continue;
      const key = trimmed.slice(0, idx).trim();
      const value = trimmed.slice(idx + 1).trim().replace(/^["']|["']$/g, '');
      if (!(key in process.env)) process.env[key] = value;
    }
  }
}

async function applyMigration(pool: Pool, filename: string): Promise<void> {
  const filepath = resolve(process.cwd(), 'database/drizzle', filename);
  if (!existsSync(filepath)) {
    throw new Error(`Migration file not found: ${filepath}`);
  }
  
  securityLogger.info(`Applying ${filename}...`);
  const sql = readFileSync(filepath, 'utf8');
  
  try {
    await pool.query(sql);
    securityLogger.info(`✅ ${filename} applied successfully`);
  } catch (err) {
    securityLogger.error(`❌ Error applying ${filename}:`, err);
    throw err;
  }
}

async function main() {
  loadEnv();
  const databaseUrl = process.env.DATABASE_URL_UNPOOLED || process.env.DATABASE_URL;
  
  if (!databaseUrl) {
    securityLogger.error('❌ DATABASE_URL or DATABASE_URL_UNPOOLED is not set');
    process.exit(1);
  }
  
  const pool = new Pool({ connectionString: databaseUrl });
  
  try {
    securityLogger.info('🚀 Applying loyalty system migrations...\n');
    
    const migrations = [
      '0033_loyalty_transactions.sql',
      '0033b_loyalty_transactions_rls.sql',
      '0035_loyalty_tiers.sql',
      '0036_loyalty_tier_benefits.sql',
      '0037_loyalty_auto_tier_up.sql'
    ];
    
    for (const migration of migrations) {
      await applyMigration(pool, migration);
    }
    
    securityLogger.info('\n✅ All loyalty migrations applied successfully!');
  } catch (err) {
    securityLogger.error('\n❌ Migration failed:', err);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

main();
