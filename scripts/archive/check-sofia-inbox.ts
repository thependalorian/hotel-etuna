/**
 * Script to check Sofia's inbox
 * 
 * Purpose: Display all incoming emails in Sofia's inbox
 * Usage: npx tsx scripts/check-sofia-inbox.ts
 */

import { prisma } from '../lib/database/connection';

async function checkSofiaInbox() {
  try {
    console.log('📧 Checking Sofia\'s Inbox...\n');

    // Get all incoming emails
    const incomingEmails = await prisma.sofiaIncomingEmail.findMany({
      orderBy: {
        received_at: 'desc',
      },
      take: 50, // Get last 50 emails
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
        conversation: {
          select: {
            id: true,
            channel: true,
            status: true,
          },
        },
      },
    });

    console.log(`Found ${incomingEmails.length} emails in Sofia's inbox\n`);

    if (incomingEmails.length === 0) {
      console.log('📭 Sofia\'s inbox is empty!');
      console.log('\n💡 To add emails to the inbox:');
      console.log('   1. Configure an email inbox in sofia_email_inbox_config');
      console.log('   2. Run the email inbox monitor cron job');
      console.log('   3. Send an email to the configured inbox address');
      return;
    }

    // Group by status
    const byStatus = incomingEmails.reduce((acc, email) => {
      const status = email.status || 'unknown';
      if (!acc[status]) {
        acc[status] = [];
      }
      acc[status].push(email);
      return acc;
    }, {} as Record<string, typeof incomingEmails>);

    console.log('📊 Email Status Summary:');
    Object.entries(byStatus).forEach(([status, emails]) => {
      console.log(`   ${status}: ${emails.length}`);
    });
    console.log('');

    // Display emails
    incomingEmails.forEach((email, index) => {
      console.log(`\n📨 Email #${index + 1}`);
      console.log(`   ID: ${email.id}`);
      console.log(`   From: ${email.from_name || 'Unknown'} <${email.from_email}>`);
      console.log(`   To: ${email.to_email}`);
      console.log(`   Subject: ${email.subject}`);
      console.log(`   Status: ${email.status}`);
      console.log(`   Received: ${email.received_at.toLocaleString()}`);
      console.log(`   Fetched: ${email.fetched_at.toLocaleString()}`);
      
      if (email.processed_at) {
        console.log(`   Processed: ${email.processed_at.toLocaleString()}`);
      }
      
      if (email.replied_at) {
        console.log(`   Replied: ${email.replied_at.toLocaleString()}`);
      }
      
      if (email.error_message) {
        console.log(`   ⚠️  Error: ${email.error_message}`);
      }
      
      if (email.tenant) {
        console.log(`   Tenant: ${email.tenant.name}`);
      }
      
      if (email.property) {
        console.log(`   Property: ${email.property.name}`);
      }
      
      if (email.guest) {
        console.log(`   Guest: ${email.guest.first_name} ${email.guest.last_name} (${email.guest.email})`);
      }
      
      if (email.conversation) {
        console.log(`   Conversation: ${email.conversation.id} (${email.conversation.channel}, ${email.conversation.status})`);
      }
      
      if (email.thread_id) {
        console.log(`   Thread ID: ${email.thread_id}`);
      }
      
      if (email.text_body) {
        const preview = email.text_body.substring(0, 100);
        console.log(`   Preview: ${preview}${email.text_body.length > 100 ? '...' : ''}`);
      }
    });

    // Get inbox configurations
    console.log('\n\n📬 Email Inbox Configurations:');
    const inboxConfigs = await prisma.sofiaEmailInboxConfig.findMany({
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
      },
    });

    if (inboxConfigs.length === 0) {
      console.log('   ⚠️  No inbox configurations found!');
      console.log('\n💡 To configure an inbox:');
      console.log('   Create a record in sofia_email_inbox_config with:');
      console.log('   - tenant_id');
      console.log('   - email_address');
      console.log('   - imap_host, imap_port, imap_username, imap_password');
      console.log('   - is_active: true');
    } else {
      inboxConfigs.forEach((config, index) => {
        console.log(`\n   Config #${index + 1}:`);
        console.log(`   Email: ${config.email_address}`);
        console.log(`   IMAP: ${config.imap_host}:${config.imap_port}`);
        console.log(`   Active: ${config.is_active ? '✅' : '❌'}`);
        console.log(`   Auto Reply: ${config.auto_reply ? '✅' : '❌'}`);
        if (config.tenant) {
          console.log(`   Tenant: ${config.tenant.name}`);
        }
        if (config.property) {
          console.log(`   Property: ${config.property.name}`);
        }
        if (config.last_checked_at) {
          console.log(`   Last Checked: ${config.last_checked_at.toLocaleString()}`);
        } else {
          console.log(`   Last Checked: Never`);
        }
      });
    }

    // Get email threads
    console.log('\n\n🧵 Email Threads:');
    const threads = await prisma.sofiaEmailThread.findMany({
      orderBy: {
        last_email_at: 'desc',
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

    if (threads.length === 0) {
      console.log('   📭 No email threads found');
    } else {
      threads.forEach((thread, index) => {
        console.log(`\n   Thread #${index + 1}:`);
        console.log(`   Thread ID: ${thread.thread_id}`);
        console.log(`   Subject: ${thread.subject}`);
        console.log(`   Emails: ${thread.email_count}`);
        console.log(`   Status: ${thread.status}`);
        if (thread.last_email_at) {
          console.log(`   Last Email: ${thread.last_email_at.toLocaleString()}`);
        }
        if (thread.last_replied_at) {
          console.log(`   Last Replied: ${thread.last_replied_at.toLocaleString()}`);
        }
        if (thread.tenant) {
          console.log(`   Tenant: ${thread.tenant.name}`);
        }
        if (thread.property) {
          console.log(`   Property: ${thread.property.name}`);
        }
        if (thread.guest) {
          console.log(`   Guest: ${thread.guest.first_name} ${thread.guest.last_name}`);
        }
      });
    }

  } catch (error) {
    console.error('❌ Error checking Sofia inbox:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

checkSofiaInbox()
  .then(() => {
    console.log('\n✅ Inbox check completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Inbox check failed:', error);
    process.exit(1);
  });
