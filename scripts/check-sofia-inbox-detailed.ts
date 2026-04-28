/**
 * Detailed Sofia Inbox Check Script
 * 
 * Purpose: Display detailed information about Sofia's inbox including raw database queries
 * Usage: npx tsx scripts/check-sofia-inbox-detailed.ts
 */

import { prisma } from '../lib/database/connection';

async function checkSofiaInboxDetailed() {
  try {
    console.log('📧 Checking Sofia\'s Inbox (Detailed)...\n');

    // Direct database query to check if tables exist and have data
    console.log('🔍 Checking database tables...\n');

    // Check sofia_incoming_emails
    try {
      const incomingEmailsCount = await prisma.$queryRaw<Array<{ count: bigint }>>`
        SELECT COUNT(*) as count FROM sofia_incoming_emails
      `;
      console.log(`📨 sofia_incoming_emails: ${incomingEmailsCount[0]?.count || 0} records`);

      if (Number(incomingEmailsCount[0]?.count || 0) > 0) {
        const emails = await prisma.sofiaIncomingEmail.findMany({
          orderBy: {
            received_at: 'desc',
          },
          take: 20,
        });

        console.log('\n📧 Incoming Emails:');
        emails.forEach((email, index) => {
          console.log(`\n  Email #${index + 1}:`);
          console.log(`    ID: ${email.id}`);
          console.log(`    From: ${email.from_email}`);
          console.log(`    To: ${email.to_email}`);
          console.log(`    Subject: ${email.subject}`);
          console.log(`    Status: ${email.status}`);
          console.log(`    Received: ${email.received_at.toLocaleString()}`);
          if (email.text_body) {
            const preview = email.text_body.substring(0, 80);
            console.log(`    Preview: ${preview}${email.text_body.length > 80 ? '...' : ''}`);
          }
        });
      }
    } catch (error: any) {
      if (error.code === '42P01') {
        console.log('📨 sofia_incoming_emails: Table does not exist');
      } else {
        console.log(`📨 sofia_incoming_emails: Error - ${error.message}`);
      }
    }

    // Check sofia_email_inbox_config
    try {
      const configsCount = await prisma.$queryRaw<Array<{ count: bigint }>>`
        SELECT COUNT(*) as count FROM sofia_email_inbox_config
      `;
      console.log(`\n📬 sofia_email_inbox_config: ${configsCount[0]?.count || 0} records`);

      if (Number(configsCount[0]?.count || 0) > 0) {
        const configs = await prisma.sofiaEmailInboxConfig.findMany({
          take: 10,
        });

        console.log('\n📬 Inbox Configurations:');
        configs.forEach((config, index) => {
          console.log(`\n  Config #${index + 1}:`);
          console.log(`    ID: ${config.id}`);
          console.log(`    Email: ${config.email_address}`);
          console.log(`    IMAP: ${config.imap_host}:${config.imap_port}`);
          console.log(`    Active: ${config.is_active ? '✅' : '❌'}`);
          console.log(`    Auto Reply: ${config.auto_reply ? '✅' : '❌'}`);
          if (config.last_checked_at) {
            console.log(`    Last Checked: ${config.last_checked_at.toLocaleString()}`);
          }
        });
      }
    } catch (error: any) {
      if (error.code === '42P01') {
        console.log('📬 sofia_email_inbox_config: Table does not exist');
      } else {
        console.log(`📬 sofia_email_inbox_config: Error - ${error.message}`);
      }
    }

    // Check sofia_email_threads
    try {
      const threadsCount = await prisma.$queryRaw<Array<{ count: bigint }>>`
        SELECT COUNT(*) as count FROM sofia_email_threads
      `;
      console.log(`\n🧵 sofia_email_threads: ${threadsCount[0]?.count || 0} records`);
    } catch (error: any) {
      if (error.code === '42P01') {
        console.log('🧵 sofia_email_threads: Table does not exist');
      } else {
        console.log(`🧵 sofia_email_threads: Error - ${error.message}`);
      }
    }

    // Also check using Prisma with includes
    console.log('\n\n📊 Using Prisma ORM:');
    const emails = await prisma.sofiaIncomingEmail.findMany({
      orderBy: {
        received_at: 'desc',
      },
      take: 10,
      include: {
        tenant: {
          select: {
            name: true,
          },
        },
        property: {
          select: {
            name: true,
          },
        },
        guest: {
          select: {
            email: true,
            first_name: true,
            last_name: true,
          },
        },
      },
    });

    console.log(`Found ${emails.length} emails via Prisma`);

    if (emails.length > 0) {
      console.log('\n📧 Email Details:');
      emails.forEach((email, index) => {
        console.log(`\n  ${index + 1}. ${email.subject}`);
        console.log(`     From: ${email.from_email}`);
        console.log(`     Status: ${email.status}`);
        console.log(`     Received: ${email.received_at.toLocaleString()}`);
      });
    }

  } catch (error) {
    console.error('❌ Error:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

checkSofiaInboxDetailed()
  .then(() => {
    console.log('\n✅ Detailed inbox check completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Detailed inbox check failed:', error);
    process.exit(1);
  });
