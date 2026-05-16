/**
 * Migration Script: Create room_qr_codes Table
 * 
 * Purpose: Create the room_qr_codes table to enable QR code functionality
 * Location: /scripts/run-qr-codes-migration.ts
 * 
 * Usage: npx tsx scripts/run-qr-codes-migration.ts
 */

import { prisma } from '@/lib/database/connection';
import { readFileSync } from 'fs';
import { join } from 'path';

async function runMigration() {
  console.log('🔄 Running QR Codes Table Migration...\n');

  try {
    // Check if table already exists
    const tableExists = await prisma.$queryRaw<Array<{ exists: boolean }>>`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'room_qr_codes'
      ) as exists
    `;

    if (tableExists[0]?.exists) {
      console.log('✅ Table room_qr_codes already exists\n');
      
      // Verify structure
      const columns = await prisma.$queryRaw<Array<{ column_name: string; data_type: string }>>`
        SELECT column_name, data_type
        FROM information_schema.columns
        WHERE table_name = 'room_qr_codes'
        ORDER BY ordinal_position
      `;
      
      console.log('📋 Table structure:');
      columns.forEach(col => {
        console.log(`   - ${col.column_name}: ${col.data_type}`);
      });
      console.log('');
      return;
    }

    console.log('📝 Creating room_qr_codes table...');
    
    // Create table (using TEXT for IDs to match existing schema)
    await prisma.$executeRaw`
      CREATE TABLE IF NOT EXISTS room_qr_codes (
        id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
        room_id TEXT NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
        property_id TEXT NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
        qr_code VARCHAR(255) UNIQUE NOT NULL,
        qr_code_url TEXT NOT NULL,
        qr_code_image_url TEXT,
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `;

    // Create indexes
    console.log('📝 Creating indexes...');
    await prisma.$executeRaw`CREATE INDEX IF NOT EXISTS idx_room_qr_codes_room_id ON room_qr_codes(room_id)`;
    await prisma.$executeRaw`CREATE INDEX IF NOT EXISTS idx_room_qr_codes_property_id ON room_qr_codes(property_id)`;
    await prisma.$executeRaw`CREATE INDEX IF NOT EXISTS idx_room_qr_codes_qr_code ON room_qr_codes(qr_code)`;
    await prisma.$executeRaw`CREATE INDEX IF NOT EXISTS idx_room_qr_codes_is_active ON room_qr_codes(is_active) WHERE is_active = true`;
    await prisma.$executeRaw`CREATE INDEX IF NOT EXISTS idx_room_qr_codes_created_at ON room_qr_codes(created_at)`;

    // Create or replace the update function
    console.log('📝 Creating updated_at trigger function...');
    await prisma.$executeRaw`
      CREATE OR REPLACE FUNCTION update_updated_at_column()
      RETURNS TRIGGER AS $$
      BEGIN
        NEW.updated_at = NOW();
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql
    `;

    // Create trigger
    console.log('📝 Creating updated_at trigger...');
    await prisma.$executeRaw`
      DROP TRIGGER IF EXISTS update_room_qr_codes_updated_at ON room_qr_codes
    `;
    await prisma.$executeRaw`
      CREATE TRIGGER update_room_qr_codes_updated_at 
        BEFORE UPDATE ON room_qr_codes 
        FOR EACH ROW 
        EXECUTE FUNCTION update_updated_at_column()
    `;

    // Add comments (optional, ignore errors)
    try {
      await prisma.$executeRaw`COMMENT ON TABLE room_qr_codes IS 'QR codes for hotel rooms (room service, checkout, etc.)'`;
      await prisma.$executeRaw`COMMENT ON COLUMN room_qr_codes.qr_code IS 'NamQR encoded string (Bank of Namibia v5.0 standard)'`;
      await prisma.$executeRaw`COMMENT ON COLUMN room_qr_codes.qr_code_url IS 'Full URL/URI for the QR code'`;
      await prisma.$executeRaw`COMMENT ON COLUMN room_qr_codes.qr_code_image_url IS 'Optional: URL to stored QR code image'`;
      await prisma.$executeRaw`COMMENT ON COLUMN room_qr_codes.is_active IS 'Whether the QR code is currently active and can be scanned'`;
    } catch (error) {
      // Comments are optional
    }

    // Verify table was created
    const verifyExists = await prisma.$queryRaw<Array<{ exists: boolean }>>`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'room_qr_codes'
      ) as exists
    `;

    if (verifyExists[0]?.exists) {
      console.log('✅ Migration completed successfully!\n');
      
      // Show table structure
      const columns = await prisma.$queryRaw<Array<{ column_name: string; data_type: string }>>`
        SELECT column_name, data_type
        FROM information_schema.columns
        WHERE table_name = 'room_qr_codes'
        ORDER BY ordinal_position
      `;
      
      console.log('📋 Table structure:');
      columns.forEach(col => {
        console.log(`   - ${col.column_name}: ${col.data_type}`);
      });
      
      // Check indexes
      const indexes = await prisma.$queryRaw<Array<{ indexname: string }>>`
        SELECT indexname
        FROM pg_indexes
        WHERE tablename = 'room_qr_codes'
      `;
      
      if (indexes.length > 0) {
        console.log('\n📊 Indexes created:');
        indexes.forEach(idx => {
          console.log(`   - ${idx.indexname}`);
        });
      }
      
      console.log('\n✅ QR codes functionality is now enabled!\n');
    } else {
      throw new Error('Table was not created successfully');
    }

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
