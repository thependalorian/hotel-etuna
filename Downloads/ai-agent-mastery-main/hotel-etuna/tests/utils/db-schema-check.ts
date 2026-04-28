/**
 * Database Schema Check Utility
 *
 * Purpose: Check what columns actually exist in the database (Drizzle)
 * Location: tests/utils/db-schema-check.ts
 *
 * Run with: npx tsx tests/utils/db-schema-check.ts
 */

import { executeRawSql } from '@/lib/db';

type ColRow = { column_name: string; data_type: string; is_nullable: string };

async function checkSchema() {
  console.log('🔍 Checking database schema...\n');

  try {
    console.log('📋 Users table columns:');
    const userColumns = (await executeRawSql`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'users' AND table_schema = 'public'
      ORDER BY ordinal_position
    `) as ColRow[];
    userColumns.forEach((col) => {
      console.log(`  - ${col.column_name} (${col.data_type}) ${col.is_nullable === 'YES' ? 'NULL' : 'NOT NULL'}`);
    });

    console.log('\n📋 Tenants table columns:');
    const tenantColumns = (await executeRawSql`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'tenants' AND table_schema = 'public'
      ORDER BY ordinal_position
    `) as ColRow[];
    tenantColumns.forEach((col) => {
      console.log(`  - ${col.column_name} (${col.data_type}) ${col.is_nullable === 'YES' ? 'NULL' : 'NOT NULL'}`);
    });

    console.log('\n✅ Schema check complete!');
  } catch (error: unknown) {
    console.error('❌ Error checking schema:', (error as Error).message);
  }
}

checkSchema();
