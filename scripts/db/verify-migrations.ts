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

// Load environment variables from .env.local
config({ path: path.join(process.cwd(), '.env.local') });

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error('❌ DATABASE_URL not found in environment');
  process.exit(1);
}

const sql = neon(DATABASE_URL);

async function verifyMigrations() {
  console.log('🔍 Verifying migration state...\n');

  // 1. Read _journal.json
  const journalPath = path.join(process.cwd(), 'database/drizzle/meta/_journal.json');
  const journal = JSON.parse(fs.readFileSync(journalPath, 'utf-8'));
  
  console.log(`📋 Journal tracks ${journal.entries.length} migrations:`);
  journal.entries.forEach((entry: any) => {
    console.log(`  - ${entry.tag} (idx: ${entry.idx})`);
  });

  // 2. Count SQL files on disk
  const migrationsDir = path.join(process.cwd(), 'database/drizzle');
  const sqlFiles = fs.readdirSync(migrationsDir)
    .filter(f => f.endsWith('.sql'))
    .sort();
  
  console.log(`\n📁 Found ${sqlFiles.length} SQL files on disk:`);
  sqlFiles.forEach((file, idx) => {
    console.log(`  ${idx}: ${file}`);
  });

  // 3. Query database for applied migrations
  try {
    const result = await sql`
      SELECT id, hash, created_at 
      FROM drizzle.__drizzle_migrations 
      ORDER BY created_at
    `;
    
    console.log(`\n✅ Database has ${result.length} applied migrations:`);
    result.forEach((row, idx) => {
      console.log(`  ${idx}: ${row.id} (${new Date(row.created_at).toISOString()})`);
    });

    // 4. Detect inconsistencies
    console.log('\n🔎 Inconsistency Analysis:');
    
    if (journal.entries.length !== sqlFiles.length) {
      console.log(`⚠️  Journal mismatch: journal=${journal.entries.length}, disk=${sqlFiles.length}`);
    }
    
    if (result.length !== sqlFiles.length) {
      console.log(`⚠️  Database mismatch: db=${result.length}, disk=${sqlFiles.length}`);
    }
    
    if (journal.entries.length !== result.length) {
      console.log(`⚠️  Journal/DB mismatch: journal=${journal.entries.length}, db=${result.length}`);
    }

    if (journal.entries.length === sqlFiles.length && result.length === sqlFiles.length) {
      console.log('✅ All sources in sync!');
    } else {
      console.log('\n❌ MIGRATION STATE IS INCONSISTENT');
      console.log('   Action required: Regenerate journal or reset database');
    }

  } catch (dbError: any) {
    console.error('\n❌ Database query failed:');
    console.error(dbError.message);
    
    if (dbError.message.includes('does not exist')) {
      console.log('\n💡 Migrations table does not exist - database may need initialization');
    }
  }
}

verifyMigrations()
  .then(() => {
    console.log('\n✅ Verification complete');
    process.exit(0);
  })
  .catch((err) => {
    console.error('\n❌ Verification failed:', err);
    process.exit(1);
  });
