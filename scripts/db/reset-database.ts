/**
 * Database Reset Script
 * 
 * Purpose: Reset database to clean state and reapply all migrations
 * Part of Agent A1's database gate verification tasks
 * 
 * WARNING: This will drop all tables and data!
 */

import { neon } from '@neondatabase/serverless';
import { exec } from 'child_process';
import { promisify } from 'util';
import * as fs from 'fs';
import * as path from 'path';
import { config } from 'dotenv';

// Load environment variables from .env.local
config({ path: path.join(process.cwd(), '.env.local') });

const execAsync = promisify(exec);

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  securityLogger.error('❌ DATABASE_URL not found in environment');
  process.exit(1);
}

const sql = neon(DATABASE_URL);

// Also create a connection using node-postgres for DDL operations
import { Pool } from 'pg';
import { securityLogger } from '@/lib/utils/security-logger';
const pool = new Pool({ connectionString: DATABASE_URL });

async function resetDatabase() {
  securityLogger.info('🔄 Starting database reset...\n');

  try {
    // Step 1: Nuclear option - drop and recreate public schema using pg Pool
    securityLogger.info('📋 Step 1: Dropping and recreating public schema...');
    securityLogger.info('   This will remove ALL objects (tables, types, functions, etc.)');
    securityLogger.info('   Using direct PostgreSQL connection for DDL operations');
    
    // Check what exists before
    const beforeCheck = await pool.query(`SELECT schema_name FROM information_schema.schemata WHERE schema_name = 'public'`);
    securityLogger.info(`   Before: public schema exists = ${beforeCheck.rows.length > 0}`);
    
    // Drop public schema using direct PostgreSQL connection
    await pool.query('DROP SCHEMA IF EXISTS public CASCADE');
    
    // Verify it's actually gone
    const afterDrop = await pool.query(`SELECT schema_name FROM information_schema.schemata WHERE schema_name = 'public'`);
    securityLogger.info(`   After DROP: public schema exists = ${afterDrop.rows.length > 0}`);
    
    // Recreate public schema
    await pool.query('CREATE SCHEMA public');
    await pool.query('GRANT ALL ON SCHEMA public TO public');
    
    // Verify it's back
    const afterCreate = await pool.query(`SELECT schema_name FROM information_schema.schemata WHERE schema_name = 'public'`);
    securityLogger.info(`   After CREATE: public schema exists = ${afterCreate.rows.length > 0}`);
    securityLogger.info('   ✓ Public schema dropped and recreated');

    // Step 2: Drop Drizzle's migration table if it exists
    securityLogger.info('\n📋 Step 2: Dropping Drizzle migration tracking...');
    await pool.query('DROP SCHEMA IF EXISTS drizzle CASCADE');
    securityLogger.info('   ✓ Dropped drizzle schema');

    // Step 3: Verify clean state
    securityLogger.info('\n📋 Step 3: Verifying clean state...');
    const remainingTables = await sql`
      SELECT tablename 
      FROM pg_tables 
      WHERE schemaname = 'public'
    `;

    if (remainingTables.length > 0) {
      securityLogger.info('   ⚠️  Warning: Some tables remain:');
      remainingTables.forEach(t => securityLogger.info(`      - ${t.tablename}`));
    } else {
      securityLogger.info('   ✓ Database is clean');
    }

    // Step 4: Run migrations
    securityLogger.info('\n📋 Step 4: Applying migrations with drizzle-kit...');
    const { stdout, stderr } = await execAsync('npx drizzle-kit migrate');
    securityLogger.info(stdout);
    if (stderr) securityLogger.error(stderr);
    securityLogger.info('   ✓ Migrations applied');

    // Step 5: Verify migration state
    securityLogger.info('\n📋 Step 5: Verifying final state...');
    
    const finalTables = await sql`
      SELECT tablename 
      FROM pg_tables 
      WHERE schemaname = 'public'
      ORDER BY tablename
    `;

    securityLogger.info(`   ✓ Database now has ${finalTables.length} tables:`);
    finalTables.forEach(t => securityLogger.info(`      - ${t.tablename}`));

    const migrations = await sql`
      SELECT id, created_at
      FROM drizzle.__drizzle_migrations
      ORDER BY created_at
    `;

    securityLogger.info(`   ✓ Drizzle tracking table has ${migrations.length} migrations`);

    // Step 6: Verify journal matches
    const journalPath = path.join(process.cwd(), 'database/drizzle/meta/_journal.json');
    const journal = JSON.parse(fs.readFileSync(journalPath, 'utf-8'));
    
    securityLogger.info(`   ✓ Journal file has ${journal.entries.length} entries`);

    if (migrations.length === journal.entries.length) {
      securityLogger.info('\n✅ DATABASE RESET SUCCESSFUL');
      securityLogger.info(`   - ${migrations.length} migrations applied`);
      securityLogger.info(`   - ${finalTables.length} tables created`);
      securityLogger.info(`   - Journal and database are in sync`);
    } else {
      securityLogger.info('\n⚠️  WARNING: Migration count mismatch');
      securityLogger.info(`   - Database: ${migrations.length} migrations`);
      securityLogger.info(`   - Journal: ${journal.entries.length} entries`);
      securityLogger.info('   - This may indicate a journal.json issue');
    }

  } catch (error: any) {
    securityLogger.error('\n❌ Database reset failed:', error.message);
    throw error;
  } finally {
    // Always close the pool connection
    await pool.end();
  }
}

// Confirmation prompt
securityLogger.info('⚠️  WARNING: This will DELETE ALL DATA in the database!');
securityLogger.info('⚠️  Press Ctrl+C to cancel, or wait 5 seconds to proceed...\n');

setTimeout(() => {
  resetDatabase()
    .then(() => {
      securityLogger.info('\n✅ Reset complete');
      process.exit(0);
    })
    .catch((err) => {
      securityLogger.error('\n❌ Reset failed:', err);
      process.exit(1);
    });
}, 5000);
