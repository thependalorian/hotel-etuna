/**
 * Script to run email inbox monitoring migration
 * 
 * Purpose: Apply database migration for email inbox monitoring tables
 * Usage: npx tsx scripts/run-email-inbox-migration.ts
 */

import { prisma } from '../lib/database/connection';
import { readFileSync } from 'fs';
import { join } from 'path';

async function runMigration() {
  try {
    console.log('Reading migration file...');
    const migrationPath = join(__dirname, '../database/migrations/009_email_inbox_monitoring.sql');
    const migrationSQL = readFileSync(migrationPath, 'utf-8');

    console.log('Executing migration...');
    
    // Split SQL into individual statements
    // Handle multi-line statements and dollar-quoted strings properly
    const statements: string[] = [];
    let currentStatement = '';
    let inDollarQuote = false;
    let dollarTag = '';
    const lines = migrationSQL.split('\n');
    
    for (const line of lines) {
      const trimmed = line.trim();
      
      // Skip comment-only lines
      if (trimmed.startsWith('--') && !inDollarQuote) {
        continue;
      }
      
      // Check for dollar-quoted strings ($$ or $tag$)
      const dollarQuoteMatch = trimmed.match(/\$([^$]*)\$/);
      if (dollarQuoteMatch) {
        if (!inDollarQuote) {
          // Starting dollar quote
          inDollarQuote = true;
          dollarTag = dollarQuoteMatch[1];
        } else if (dollarQuoteMatch[1] === dollarTag) {
          // Ending dollar quote
          inDollarQuote = false;
          dollarTag = '';
        }
      }
      
      currentStatement += line + '\n';
      
      // If line ends with semicolon and we're not in a dollar quote, it's the end of a statement
      if (trimmed.endsWith(';') && !inDollarQuote) {
        const statement = currentStatement.trim();
        if (statement.length > 0) {
          statements.push(statement);
        }
        currentStatement = '';
      }
    }
    
    // Add any remaining statement
    if (currentStatement.trim().length > 0) {
      statements.push(currentStatement.trim());
    }

    console.log(`Found ${statements.length} SQL statements to execute`);

    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      
      try {
        console.log(`Executing statement ${i + 1}/${statements.length}...`);
        await prisma.$executeRawUnsafe(statement);
      } catch (error: any) {
        // Ignore "already exists" errors (tables, indexes, etc.)
        const errorMessage = error?.message || '';
        const errorCode = error?.code || '';
        
        if (
          errorMessage.includes('already exists') ||
          errorCode === '42P07' || // duplicate_table
          errorCode === '42710' || // duplicate_object
          errorMessage.includes('relation') && errorMessage.includes('already exists')
        ) {
          console.log(`  ⚠️  Statement ${i + 1} skipped (already exists)`);
          continue;
        }
        
        // Log the statement that failed for debugging
        console.error(`Failed statement: ${statement.substring(0, 100)}...`);
        throw error;
      }
    }

    console.log('✅ Migration completed successfully!');
    console.log('Tables created:');
    console.log('  - sofia_incoming_emails');
    console.log('  - sofia_email_threads');
    console.log('  - sofia_email_inbox_config');
  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

runMigration()
  .then(() => {
    console.log('Migration script completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Migration script failed:', error);
    process.exit(1);
  });
