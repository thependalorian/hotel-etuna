/**
 * Setup Email Inbox and Fetch Emails
 * 
 * Purpose: Create inbox configuration from .env and fetch emails
 * Usage: npx tsx scripts/setup-and-fetch-emails.ts
 */

import { prisma } from '../lib/database/connection';
import { EmailInboxService } from '../lib/services/sofia/EmailInboxService';
import { v4 as uuidv4 } from 'uuid';
import { config } from 'dotenv';
import { resolve } from 'path';

// Load environment variables
config({ path: resolve(__dirname, '../.env') });

async function setupAndFetchEmails() {
  try {
    console.log('📧 Setting up email inbox and fetching emails...\n');

    // Get email config from .env
    const emailAddress = process.env.NAMECHEAP_EMAIL || process.env.EMAIL_SENDER_EMAIL;
    const imapHost = process.env.NAMECHEAP_IMAP_HOST || 'mail.privateemail.com';
    const imapPort = parseInt(process.env.NAMECHEAP_IMAP_PORT || '993');
    const imapPassword = process.env.NAMECHEAP_EMAIL_PASSWORD || process.env.EMAIL_SMTP_PASS;

    if (!emailAddress || !imapPassword) {
      console.error('❌ Missing email configuration in .env');
      console.log('Required: NAMECHEAP_EMAIL (or EMAIL_SENDER_EMAIL) and NAMECHEAP_EMAIL_PASSWORD (or EMAIL_SMTP_PASS)');
      return;
    }

    console.log(`📬 Email: ${emailAddress}`);
    console.log(`📬 IMAP Host: ${imapHost}:${imapPort}\n`);

    // Get first tenant (or create test tenant)
    let tenant = await prisma.tenant.findFirst({
      orderBy: {
        createdAt: 'asc',
      },
    });

    if (!tenant) {
      console.log('⚠️  No tenant found. Creating test tenant...');
      tenant = await prisma.tenant.create({
        data: {
          id: uuidv4(),
          name: 'Test Tenant',
          status: 'active',
        },
      });
    }

    console.log(`✅ Using tenant: ${tenant.name} (${tenant.id})\n`);

    // Check if inbox config already exists
    let inboxConfig = await prisma.sofiaEmailInboxConfig.findFirst({
      where: {
        tenant_id: tenant.id,
        email_address: emailAddress,
      },
    });

    if (!inboxConfig) {
      console.log('📝 Creating inbox configuration...');
      inboxConfig = await prisma.sofiaEmailInboxConfig.create({
        data: {
          id: uuidv4(),
          tenant_id: tenant.id,
          email_address: emailAddress,
          imap_host: imapHost,
          imap_port: imapPort,
          imap_secure: true,
          imap_username: emailAddress,
          imap_password: imapPassword,
          folder_name: 'INBOX',
          check_interval_minutes: 5,
          is_active: true,
          auto_reply: true,
          auto_link_conversation: true,
          auto_create_guest: true,
        },
      });
      console.log('✅ Inbox configuration created!\n');
    } else {
      console.log('✅ Inbox configuration already exists\n');
    }

    // Now fetch emails
    console.log('📥 Fetching emails from inbox...\n');
    const emailInboxService = new EmailInboxService();

    try {
      const fetchedCount = await emailInboxService.fetchNewEmails(inboxConfig.id);
      console.log(`✅ Fetched ${fetchedCount} new emails!\n`);

      // Process pending emails
      console.log('⚙️  Processing pending emails...\n');
      const processedCount = await emailInboxService.processPendingEmails(tenant.id);
      console.log(`✅ Processed ${processedCount} pending emails!\n`);

      // Check inbox again
      console.log('📊 Checking inbox contents...\n');
      const emails = await prisma.sofiaIncomingEmail.findMany({
        where: {
          tenant_id: tenant.id,
        },
        orderBy: {
          received_at: 'desc',
        },
        take: 10,
      });

      console.log(`📧 Found ${emails.length} emails in database:\n`);

      if (emails.length > 0) {
        emails.forEach((email, index) => {
          console.log(`${index + 1}. ${email.subject}`);
          console.log(`   From: ${email.from_email}`);
          console.log(`   Status: ${email.status}`);
          console.log(`   Received: ${email.received_at.toLocaleString()}`);
          if (email.text_body) {
            const preview = email.text_body.substring(0, 60);
            console.log(`   Preview: ${preview}${email.text_body.length > 60 ? '...' : ''}`);
          }
          console.log('');
        });
      } else {
        console.log('📭 No emails found in database yet.');
        console.log('💡 This could mean:');
        console.log('   - No new emails in the inbox');
        console.log('   - IMAP connection issue');
        console.log('   - Emails were already fetched');
      }
    } catch (error: any) {
      console.error('❌ Error fetching emails:', error.message);
      if (error.message.includes('ENOTFOUND') || error.message.includes('ECONNREFUSED')) {
        console.log('\n💡 IMAP connection failed. Check:');
        console.log('   - IMAP host and port are correct');
        console.log('   - Email credentials are correct');
        console.log('   - IMAP is enabled for the email account');
        console.log('   - Network/firewall allows IMAP connections');
      }
      throw error;
    }

  } catch (error) {
    console.error('❌ Error:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

setupAndFetchEmails()
  .then(() => {
    console.log('\n✅ Setup and fetch completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Setup and fetch failed:', error);
    process.exit(1);
  });
