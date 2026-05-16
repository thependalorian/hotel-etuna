/**
 * Create sofia_email_logs Table Script
 * 
 * Purpose: Create sofia_email_logs table if it doesn't exist
 * Location: /scripts/create-sofia-email-logs-table.ts
 * 
 * Usage:
 * ```bash
 * npx tsx scripts/create-sofia-email-logs-table.ts
 * ```
 */

import { config } from 'dotenv';
import { resolve } from 'path';
import { prisma } from '../lib/database/connection';

config({ path: resolve(__dirname, '../.env') });

async function createSofiaEmailLogsTable() {
  console.log('🔧 Creating sofia_email_logs table...\n');

  try {
    // Check if table exists
    const tableExists = await prisma.$queryRaw<Array<{ exists: boolean }>>`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'sofia_email_logs'
      ) as exists
    `;

    if (tableExists[0]?.exists) {
      console.log('✅ Table sofia_email_logs already exists\n');
      return;
    }

    // Create table (with optional foreign keys - they may not exist)
    await prisma.$executeRaw`
      CREATE TABLE sofia_email_logs (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        tenant_id TEXT NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
        email_server_id UUID,
        template_id UUID,
        recipient_email VARCHAR(255) NOT NULL,
        recipient_name VARCHAR(255),
        subject TEXT NOT NULL,
        html_content TEXT,
        text_content TEXT,
        status VARCHAR(50) DEFAULT 'pending',
        sent_at TIMESTAMP WITH TIME ZONE,
        delivered_at TIMESTAMP WITH TIME ZONE,
        opened_at TIMESTAMP WITH TIME ZONE,
        clicked_at TIMESTAMP WITH TIME ZONE,
        bounce_reason TEXT,
        error_message TEXT,
        metadata JSONB DEFAULT '{}',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `;

    // Add foreign key constraints if tables exist (optional)
    try {
      await prisma.$executeRaw`
        DO $$
        BEGIN
          IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'email_servers') THEN
            ALTER TABLE sofia_email_logs 
            ADD CONSTRAINT sofia_email_logs_email_server_id_fkey 
            FOREIGN KEY (email_server_id) REFERENCES email_servers(id) ON DELETE SET NULL;
          END IF;
        END $$;
      `;
    } catch (e) {
      console.log('⚠️  email_servers table does not exist, skipping foreign key');
    }

    try {
      await prisma.$executeRaw`
        DO $$
        BEGIN
          IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'sofia_email_templates') THEN
            ALTER TABLE sofia_email_logs 
            ADD CONSTRAINT sofia_email_logs_template_id_fkey 
            FOREIGN KEY (template_id) REFERENCES sofia_email_templates(id) ON DELETE SET NULL;
          END IF;
        END $$;
      `;
    } catch (e) {
      console.log('⚠️  sofia_email_templates table does not exist, skipping foreign key');
    }

    // Create indexes
    await prisma.$executeRaw`
      CREATE INDEX idx_sofia_email_logs_tenant_id ON sofia_email_logs(tenant_id)
    `;
    await prisma.$executeRaw`
      CREATE INDEX idx_sofia_email_logs_status ON sofia_email_logs(status)
    `;
    await prisma.$executeRaw`
      CREATE INDEX idx_sofia_email_logs_recipient_email ON sofia_email_logs(recipient_email)
    `;
    await prisma.$executeRaw`
      CREATE INDEX idx_sofia_email_logs_created_at ON sofia_email_logs(created_at)
    `;

    console.log('✅ Table sofia_email_logs created successfully\n');
    console.log('✅ Indexes created successfully\n');
  } catch (error: any) {
    if (error.message?.includes('already exists')) {
      console.log('✅ Table sofia_email_logs already exists\n');
    } else {
      console.error('❌ Error creating table:', error.message);
      throw error;
    }
  }
}

createSofiaEmailLogsTable()
  .then(() => {
    console.log('🎉 Migration completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Migration failed:', error);
    process.exit(1);
  });
