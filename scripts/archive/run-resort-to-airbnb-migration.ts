/**
 * Migration Script: Replace Resort with AirBnB
 * 
 * Purpose: Update existing 'resort' property types to 'airbnb'
 * Location: /scripts/run-resort-to-airbnb-migration.ts
 * 
 * Usage: npx tsx scripts/run-resort-to-airbnb-migration.ts
 */

import { prisma } from '@/lib/database/connection';
import { readFileSync } from 'fs';
import { join } from 'path';

async function runMigration() {
  console.log('🔄 Running Resort to AirBnB Migration...\n');

  try {
    // Execute migration - update resort to airbnb
    console.log('📝 Updating resort properties to airbnb...');
    const updateResult = await prisma.$executeRaw`
      UPDATE properties 
      SET type = 'airbnb', 
          updated_at = NOW()
      WHERE LOWER(type) = 'resort'
    `;
    
    console.log(`   ✅ Updated ${updateResult} properties`);

    // Verify migration
    const resortCount = await prisma.$queryRaw<Array<{ count: bigint }>>`
      SELECT COUNT(*) as count 
      FROM properties 
      WHERE LOWER(type) = 'resort'
    `;

    const airbnbCount = await prisma.$queryRaw<Array<{ count: bigint }>>`
      SELECT COUNT(*) as count 
      FROM properties 
      WHERE LOWER(type) = 'airbnb'
    `;

    console.log('\n✅ Migration completed successfully!');
    console.log(`   - Properties with 'resort' type: ${resortCount[0]?.count || 0}`);
    console.log(`   - Properties with 'airbnb' type: ${airbnbCount[0]?.count || 0}\n`);

  } catch (error: any) {
    console.error('❌ Migration failed:', error);
    console.error('Error details:', {
      message: error.message,
      stack: error.stack,
    });
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

runMigration();
