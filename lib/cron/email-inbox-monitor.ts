/**
 * Email Inbox Monitor Cron Job
 *
 * Purpose: Scheduled task to monitor email inboxes and process incoming emails
 * Location: /lib/cron/email-inbox-monitor.ts
 *
 * Features:
 * - Fetches new emails from configured inboxes
 * - Processes emails through Sofia AI
 * - Links emails to conversations
 * - Sends automatic replies
 *
 * Uses Drizzle ORM for all database operations.
 */

import { EmailInboxService } from '@/lib/services/sofia/EmailInboxService';
import { processSofiaConciergeMessage } from '@/lib/services/ai/sofia-concierge-handler';
import { EmailService } from '@/lib/services/sofia/EmailService';
import { db } from '@/lib/db';
import {
  sofiaIncomingEmails,
  sofiaEmailInboxConfig,
  aiConversations,
  aiMessages,
  sofiaEmailThreads,
} from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { v4 as uuidv4 } from 'uuid';
import { securityLogger } from '@/lib/utils/security-logger';

const emailInboxService = new EmailInboxService();
const emailService = new EmailService();

/**
 * Main cron job function to monitor email inboxes
 */
export async function monitorEmailInboxes() {
  securityLogger.info('[Email Inbox Monitor] Starting email inbox monitoring...');

  try {
    const configs = await emailInboxService.getActiveConfigs();
    securityLogger.info(`[Email Inbox Monitor] Found ${configs.length} active inbox configurations`, { count: configs.length });

    let totalFetched = 0;
    let totalProcessed = 0;

    for (const config of configs) {
      try {
        securityLogger.info(`[Email Inbox Monitor] Fetching emails for ${config.emailAddress}...`, { emailAddress: config.emailAddress, configId: config.id });
        const fetched = await emailInboxService.fetchNewEmails(config.id);
        totalFetched += fetched;
        securityLogger.info(`[Email Inbox Monitor] Fetched ${fetched} new emails from ${config.emailAddress}`, { fetchedCount: fetched, emailAddress: config.emailAddress, configId: config.id });
      } catch (error) {
        securityLogger.error(`[Email Inbox Monitor] Error fetching emails for ${config.emailAddress}:`, error);
      }
    }

    securityLogger.info('[Email Inbox Monitor] Processing pending emails...');
    totalProcessed = await emailInboxService.processPendingEmails();
    securityLogger.info(`[Email Inbox Monitor] Processed ${totalProcessed} pending emails`, { processedCount: totalProcessed });

    await processEmailsThroughSofia();

    securityLogger.info(`[Email Inbox Monitor] Completed`, { fetchedCount: totalFetched, processedCount: totalProcessed });
  } catch (error) {
    securityLogger.error('[Email Inbox Monitor] Error in email inbox monitoring:', error);
    throw error;
  }
}

/**
 * Process emails through Sofia and send automatic replies
 */
async function processEmailsThroughSofia() {
  try {
    const pendingEmails = await db
      .select()
      .from(sofiaIncomingEmails)
      .where(eq(sofiaIncomingEmails.status, 'processed'))
      .orderBy(sofiaIncomingEmails.receivedAt)
      .limit(50);

    securityLogger.info(`[Email Inbox Monitor] Processing ${pendingEmails.length} emails through Sofia...`, { pendingEmailsCount: pendingEmails.length });

    for (const email of pendingEmails) {
      try {
        const tenantId = email.tenantId;
        if (!tenantId) continue;
        const [inboxConfig] = await db
          .select()
          .from(sofiaEmailInboxConfig)
          .where(
            and(
              eq(sofiaEmailInboxConfig.tenantId, tenantId),
              eq(sofiaEmailInboxConfig.emailAddress, email.toEmail),
              eq(sofiaEmailInboxConfig.isActive, true)
            )
          )
          .limit(1);

        if (!inboxConfig || !inboxConfig.autoReply) {
          await db
            .update(sofiaIncomingEmails)
            .set({ status: 'skipped', updatedAt: new Date() })
            .where(eq(sofiaIncomingEmails.id, email.id));
          continue;
        }

        const propertyId = email.propertyId ?? inboxConfig.propertyId ?? undefined;

        let conversationId = email.conversationId;
        if (!conversationId) {
          const [conversation] = await db
            .insert(aiConversations)
            .values({
              id: uuidv4(),
              tenantId,
              guestId: email.guestId ?? undefined,
              sessionId: `email_${email.id}`,
              channel: 'EMAIL',
              status: 'active',
            })
            .returning({ id: aiConversations.id });
          conversationId = conversation?.id;
          if (conversationId) {
            await db
              .update(sofiaIncomingEmails)
              .set({ conversationId, updatedAt: new Date() })
              .where(eq(sofiaIncomingEmails.id, email.id));
          }
        }

        const sessionId = `email_${email.id}`;
        const message = email.textBody ?? email.htmlBody ?? email.subject;
        const sofiaResponse = await processSofiaConciergeMessage(
          {
            message,
            sessionId,
            tenantId,
            propertyId,
            guestId: email.guestId ?? undefined,
            language: 'en',
            channel: 'EMAIL',
            emailData: {
              subject: email.subject,
              from_email: email.fromEmail,
              message_id: email.messageId,
            },
          },
          'guest'
        );

        await db.insert(aiMessages).values({
          id: uuidv4(),
          conversationId: conversationId!,
          senderType: 'USER',
          content: message ?? '',
          metadata: {
            email_id: email.id,
            from_email: email.fromEmail,
            subject: email.subject,
          },
        });

        await db.insert(aiMessages).values({
          id: uuidv4(),
          conversationId: conversationId!,
          senderType: 'ASSISTANT',
          content: sofiaResponse.response,
          metadata: {
            email_id: email.id,
            intent: sofiaResponse.intent,
          },
        });

        await emailService.sendEmail(tenantId, {
          to: email.fromEmail,
          subject: `Re: ${email.subject}`,
          htmlContent: sofiaResponse.response,
          textContent: sofiaResponse.response,
          propertyId: propertyId,
          metadata: {
            in_reply_to: email.messageId,
            conversation_id: conversationId,
            email_id: email.id,
          },
        });

        await db
          .update(sofiaIncomingEmails)
          .set({ status: 'replied', repliedAt: new Date(), updatedAt: new Date() })
          .where(eq(sofiaIncomingEmails.id, email.id));

        if (email.threadId) {
          await db
            .update(sofiaEmailThreads)
            .set({ lastRepliedAt: new Date(), updatedAt: new Date() })
            .where(
              and(
                eq(sofiaEmailThreads.tenantId, tenantId),
                eq(sofiaEmailThreads.threadId, email.threadId)
              )
            );
        }

        securityLogger.info(`[Email Inbox Monitor] Processed and replied to email ${email.id}`, { emailId: email.id, tenantId: email.tenantId });
      } catch (error) {
        securityLogger.error(`[Email Inbox Monitor] Error processing email ${email.id}:`, error);
        await db
          .update(sofiaIncomingEmails)
          .set({
            status: 'failed',
            errorMessage: error instanceof Error ? error.message : 'Unknown error',
            updatedAt: new Date(),
          })
          .where(eq(sofiaIncomingEmails.id, email.id));
      }
    }
  } catch (error) {
    securityLogger.error('[Email Inbox Monitor] Error processing emails through Sofia:', error);
    throw error;
  }
}

/**
 * Run the email inbox monitor (can be called from cron or API endpoint)
 */
export async function runEmailInboxMonitor() {
  try {
    await monitorEmailInboxes();
    return { success: true, message: 'Email inbox monitoring completed' };
  } catch (error) {
    securityLogger.error('[Email Inbox Monitor] Fatal error:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}
