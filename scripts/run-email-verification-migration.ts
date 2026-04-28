/**
 * Email Verification OTP Migration Script
 * 
 * Purpose: Run migration to add OTP and password reset fields to users table
 * Location: /scripts/run-email-verification-migration.ts
 * 
 * Usage: npx tsx scripts/run-email-verification-migration.ts
 */

import { readFileSync } from 'fs';
import { join } from 'path';
import { prisma } from '../lib/database/connection';

async function runMigration() {
  console.log('📧 Running Email Verification OTP Migration...\n');

  try {
    const migrationPath = join(process.cwd(), 'database/migrations/010_email_verification_otp.sql');
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
              error.message?.includes('column') && error.message?.includes('already')) {
            console.log(`⚠️  Statement ${i + 1} skipped (already exists): ${error.message}\n`);
          } else {
            throw error;
          }
        }
      }
    }

    console.log('✅ Migration completed successfully!');
    console.log('\n📋 Next steps:');
    console.log('1. Run: npx prisma generate');
    console.log('2. Verify OTP fields in User model');
    console.log('3. Test email verification flow\n');
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

runMigration();
