/**
 * Migration Script: Add is_enterprise column to properties table
 * 
 * Purpose: Apply database migration to add is_enterprise column
 * Location: /scripts/run-is-enterprise-migration.ts
 * 
 * Usage: npx tsx scripts/run-is-enterprise-migration.ts
 */

import { readFileSync } from 'fs';
import { join } from 'path';
import * as dotenv from 'dotenv';
import { resolve } from 'path';

// Load environment variables
dotenv.config({ path: resolve(process.cwd(), '.env.local') });
dotenv.config({ path: resolve(process.cwd(), '.env') });

import { prisma } from '../lib/database/connection';

async function runMigration() {
  console.log('🔧 Running is_enterprise Column Migration...\n');

  try {
    const migrationPath = join(process.cwd(), 'database/migrations/011_add_is_enterprise_column.sql');
    const migrationSQL = readFileSync(migrationPath, 'utf-8');

    // Remove comments and split into statements
    const cleanedSQL = migrationSQL
      .split('\n')
      .filter(line => !line.trim().startsWith('--'))
      .join('\n');

    // Split by semicolon and filter empty statements
    const statements = cleanedSQL
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.toLowerCase().startsWith('comment'));

    console.log(`Found ${statements.length} SQL statements to execute\n`);

    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      if (statement.trim()) {
        try {
          console.log(`Executing statement ${i + 1}/${statements.length}...`);
          // Add semicolon back for execution
          await prisma.$executeRawUnsafe(statement + ';');
          console.log(`✅ Statement ${i + 1} executed successfully\n`);
        } catch (error: any) {
          // Ignore "already exists" errors for idempotency
          if (error.message?.includes('already exists') || 
              error.message?.includes('duplicate') ||
              (error.message?.includes('column') && error.message?.includes('already'))) {
            console.log(`⚠️  Statement ${i + 1} skipped (already exists): ${error.message}\n`);
          } else {
            throw error;
          }
        }
      }
    }

    console.log('✅ Migration completed successfully!');
    console.log('\n📋 Verification:');
    
    // Verify the column exists
    const verifyResult = await prisma.$queryRaw<Array<{ column_name: string }>>`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'properties' 
        AND column_name = 'is_enterprise'
    `;
    
    if (verifyResult.length > 0) {
      console.log('✅ Column is_enterprise exists in properties table');
    } else {
      console.log('❌ Column is_enterprise was not found - migration may have failed');
    }
    
  } catch (error: any) {
    console.error('❌ Migration failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

runMigration()
  .then(() => {
    console.log('\n✅ Migration script completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Migration script failed:', error);
    process.exit(1);
  });
