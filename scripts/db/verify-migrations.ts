/**
 * Verify Database Migration State
 * 
 * Compares _journal.json with actual database state to detect inconsistencies.
 * Part of Agent A1's database gate verification.
 */

import { neon } from '@neondatabase/serverless';
import * as fs from 'fs';
import * as path from 'path';
import { config } from 'dotenv';
import { securityLogger } from '@/lib/utils/security-logger';

// Load environment variables from .env.local
config({ path: path.join(process.cwd(), '.env.local') });

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  securityLogger.error('❌ DATABASE_URL not found in environment');
  process.exit(1);
}

const sql = neon(DATABASE_URL);

async function verifyMigrations() {
  securityLogger.info('🔍 Verifying migration state...\n');

  // 1. Read _journal.json
  const journalPath = path.join(process.cwd(), 'database/drizzle/meta/_journal.json');
  const journal = JSON.parse(fs.readFileSync(journalPath, 'utf-8'));
  
  securityLogger.info(`📋 Journal tracks ${journal.entries.length} migrations:`);
  journal.entries.forEach((entry: any) => {
    securityLogger.info(`  - ${entry.tag} (idx: ${entry.idx})`);
  });

  // 2. Count SQL files on disk
  const migrationsDir = path.join(process.cwd(), 'database/drizzle');
  const sqlFiles = fs.readdirSync(migrationsDir)
    .filter(f => f.endsWith('.sql'))
    .sort();
  
  securityLogger.info(`\n📁 Found ${sqlFiles.length} SQL files on disk:`);
  sqlFiles.forEach((file, idx) => {
    securityLogger.info(`  ${idx}: ${file}`);
  });

  // 3. Query database for applied migrations
  try {
    const result = await sql`
      SELECT id, hash, created_at 
      FROM drizzle.__drizzle_migrations 
      ORDER BY created_at
    `;
    
    securityLogger.info(`\n✅ Database has ${result.length} applied migrations:`);
    result.forEach((row, idx) => {
      securityLogger.info(`  ${idx}: ${row.id} (${new Date(row.created_at).toISOString()})`);
    });

    // 4. Detect inconsistencies
    securityLogger.info('\n🔎 Inconsistency Analysis:');
    
    if (journal.entries.length !== sqlFiles.length) {
      securityLogger.info(`⚠️  Journal mismatch: journal=${journal.entries.length}, disk=${sqlFiles.length}`);
    }
    
    if (result.length !== sqlFiles.length) {
      securityLogger.info(`⚠️  Database mismatch: db=${result.length}, disk=${sqlFiles.length}`);
    }
    
    if (journal.entries.length !== result.length) {
      securityLogger.info(`⚠️  Journal/DB mismatch: journal=${journal.entries.length}, db=${result.length}`);
    }

    if (journal.entries.length === sqlFiles.length && result.length === sqlFiles.length) {
      securityLogger.info('✅ All sources in sync!');
    } else {
      securityLogger.info('\n❌ MIGRATION STATE IS INCONSISTENT');
      securityLogger.info('   Action required: Regenerate journal or reset database');
    }

  } catch (dbError: any) {
    securityLogger.error('\n❌ Database query failed:');
    securityLogger.error(dbError.message);
    
    if (dbError.message.includes('does not exist')) {
      securityLogger.info('\n💡 Migrations table does not exist - database may need initialization');
    }
  }
}

verifyMigrations()
  .then(() => {
    securityLogger.info('\n✅ Verification complete');
    process.exit(0);
  })
  .catch((err) => {
    securityLogger.error('\n❌ Verification failed:', err);
    process.exit(1);
  });
