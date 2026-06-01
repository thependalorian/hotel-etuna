/**
 * Apply CMS migrations (0029 and 0029b)
 * Run: npx tsx scripts/db/apply-cms-migrations.ts
 */

import { Pool } from 'pg';
import { readFileSync } from 'fs';
import { join } from 'path';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function applyMigrations() {
  const client = await pool.connect();
  
  try {
    console.log('📦 Applying CMS migrations...');
    
    // Read migration files
    const migration1 = readFileSync(
      join(process.cwd(), 'database/drizzle/0029_cms_pages_blocks.sql'),
      'utf-8'
    );
    
    const migration2 = readFileSync(
      join(process.cwd(), 'database/drizzle/0029b_cms_pages_blocks_rls.sql'),
      'utf-8'
    );
    
    // Apply migration 0029
    console.log('⚡ Applying 0029_cms_pages_blocks.sql...');
    await client.query(migration1);
    console.log('✅ Migration 0029 applied');
    
    // Apply migration 0029b
    console.log('⚡ Applying 0029b_cms_pages_blocks_rls.sql...');
    await client.query(migration2);
    console.log('✅ Migration 0029b applied');
    
    // Verify tables exist
    const result = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('cms_pages', 'cms_blocks')
      ORDER BY table_name;
    `);
    
    console.log('\n📋 CMS Tables:');
    result.rows.forEach(row => console.log(`  ✓ ${row.table_name}`));
    
    console.log('\n✅ All CMS migrations applied successfully!');
  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

applyMigrations().catch(console.error);
