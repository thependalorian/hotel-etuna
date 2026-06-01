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
  console.error('❌ DATABASE_URL not found in environment');
  process.exit(1);
}

const sql = neon(DATABASE_URL);

// Also create a connection using node-postgres for DDL operations
import { Pool } from 'pg';
const pool = new Pool({ connectionString: DATABASE_URL });

async function resetDatabase() {
  console.log('🔄 Starting database reset...\n');

  try {
    // Step 1: Nuclear option - drop and recreate public schema using pg Pool
    console.log('📋 Step 1: Dropping and recreating public schema...');
    console.log('   This will remove ALL objects (tables, types, functions, etc.)');
    console.log('   Using direct PostgreSQL connection for DDL operations');
    
    // Check what exists before
    const beforeCheck = await pool.query(`SELECT schema_name FROM information_schema.schemata WHERE schema_name = 'public'`);
    console.log(`   Before: public schema exists = ${beforeCheck.rows.length > 0}`);
    
    // Drop public schema using direct PostgreSQL connection
    await pool.query('DROP SCHEMA IF EXISTS public CASCADE');
    
    // Verify it's actually gone
    const afterDrop = await pool.query(`SELECT schema_name FROM information_schema.schemata WHERE schema_name = 'public'`);
    console.log(`   After DROP: public schema exists = ${afterDrop.rows.length > 0}`);
    
    // Recreate public schema
    await pool.query('CREATE SCHEMA public');
    await pool.query('GRANT ALL ON SCHEMA public TO public');
    
    // Verify it's back
    const afterCreate = await pool.query(`SELECT schema_name FROM information_schema.schemata WHERE schema_name = 'public'`);
    console.log(`   After CREATE: public schema exists = ${afterCreate.rows.length > 0}`);
    console.log('   ✓ Public schema dropped and recreated');

    // Step 2: Drop Drizzle's migration table if it exists
    console.log('\n📋 Step 2: Dropping Drizzle migration tracking...');
    await pool.query('DROP SCHEMA IF EXISTS drizzle CASCADE');
    console.log('   ✓ Dropped drizzle schema');

    // Step 3: Verify clean state
    console.log('\n📋 Step 3: Verifying clean state...');
    const remainingTables = await sql`
      SELECT tablename 
      FROM pg_tables 
      WHERE schemaname = 'public'
    `;

    if (remainingTables.length > 0) {
      console.log('   ⚠️  Warning: Some tables remain:');
      remainingTables.forEach(t => console.log(`      - ${t.tablename}`));
    } else {
      console.log('   ✓ Database is clean');
    }

    // Step 4: Run migrations
    console.log('\n📋 Step 4: Applying migrations with drizzle-kit...');
    const { stdout, stderr } = await execAsync('npx drizzle-kit migrate');
    console.log(stdout);
    if (stderr) console.error(stderr);
    console.log('   ✓ Migrations applied');

    // Step 5: Verify migration state
    console.log('\n📋 Step 5: Verifying final state...');
    
    const finalTables = await sql`
      SELECT tablename 
      FROM pg_tables 
      WHERE schemaname = 'public'
      ORDER BY tablename
    `;

    console.log(`   ✓ Database now has ${finalTables.length} tables:`);
    finalTables.forEach(t => console.log(`      - ${t.tablename}`));

    const migrations = await sql`
      SELECT id, created_at
      FROM drizzle.__drizzle_migrations
      ORDER BY created_at
    `;

    console.log(`   ✓ Drizzle tracking table has ${migrations.length} migrations`);

    // Step 6: Verify journal matches
    const journalPath = path.join(process.cwd(), 'database/drizzle/meta/_journal.json');
    const journal = JSON.parse(fs.readFileSync(journalPath, 'utf-8'));
    
    console.log(`   ✓ Journal file has ${journal.entries.length} entries`);

    if (migrations.length === journal.entries.length) {
      console.log('\n✅ DATABASE RESET SUCCESSFUL');
      console.log(`   - ${migrations.length} migrations applied`);
      console.log(`   - ${finalTables.length} tables created`);
      console.log(`   - Journal and database are in sync`);
    } else {
      console.log('\n⚠️  WARNING: Migration count mismatch');
      console.log(`   - Database: ${migrations.length} migrations`);
      console.log(`   - Journal: ${journal.entries.length} entries`);
      console.log('   - This may indicate a journal.json issue');
    }

  } catch (error: any) {
    console.error('\n❌ Database reset failed:', error.message);
    throw error;
  } finally {
    // Always close the pool connection
    await pool.end();
  }
}

// Confirmation prompt
console.log('⚠️  WARNING: This will DELETE ALL DATA in the database!');
console.log('⚠️  Press Ctrl+C to cancel, or wait 5 seconds to proceed...\n');

setTimeout(() => {
  resetDatabase()
    .then(() => {
      console.log('\n✅ Reset complete');
      process.exit(0);
    })
    .catch((err) => {
      console.error('\n❌ Reset failed:', err);
      process.exit(1);
    });
}, 5000);
