/**
 * EmailInboxService
 *
 * Purpose: Service for monitoring email inboxes, fetching incoming emails,
 *          and processing them through Sofia AI Concierge
 * Location: /lib/services/sofia/EmailInboxService.ts
 *
 * Features:
 * - IMAP email fetching
 * - Email parsing and storage
 * - Thread detection and management
 * - Automatic conversation linking
 * - Guest record creation
 *
 * Uses Drizzle ORM for all database operations.
 */

import { db } from '@/lib/db';
import {
  sofiaEmailInboxConfig,
  guests,
  sofiaEmailThreads,
  aiConversations,
  sofiaIncomingEmails,
} from '@/lib/db/schema';
import { eq, and, desc } from 'drizzle-orm';
import { ImapFlow } from 'imapflow';
import { simpleParser, ParsedMail } from 'mailparser';
import { v4 as uuidv4 } from 'uuid';
import { securityLogger } from '@/lib/utils/security-logger';

interface EmailAttachment {
  filename: string;
  contentType: string;
  size: number;
  contentId?: string;
  cid?: string;
}

interface IncomingEmailData {
  messageId: string;
  inReplyTo?: string;
  references?: string;
  from: { email: string; name?: string };
  to: string;
  cc?: string[];
  bcc?: string[];
  subject: string;
  htmlBody?: string;
  textBody?: string;
  attachments?: EmailAttachment[];
  receivedAt: Date;
}

export class EmailInboxService {
  /**
   * Fetch new emails from a configured inbox
   */
  async fetchNewEmails(configId: string): Promise<number> {
    try {
      const [configRow] = await db
        .select()
        .from(sofiaEmailInboxConfig)
        .where(eq(sofiaEmailInboxConfig.id, configId))
        .limit(1);

      if (!configRow || !configRow.isActive) {
        securityLogger.info(`Inbox config ${configId} not found or inactive`, { configId });
        return 0;
      }

      const config = configRow;
      const emailAddress = config.emailAddress;
      const imapHost = config.imapHost;
      const tenantId = config.tenantId!;
      const propertyId = config.propertyId ?? undefined;

      let client: ImapFlow | null = null;
      let fetchedCount = 0;

      try {
        client = new ImapFlow({
          host: imapHost,
          port: config.imapPort ?? 993,
          secure: config.imapSecure ?? true,
          auth: {
            user: config.imapUsername,
            pass: config.imapPassword,
          },
        });

        await client.connect();
        securityLogger.info(`Connected to IMAP server for ${emailAddress}`, { emailAddress });

        const folderName = config.folderName ?? 'INBOX';
        const mailbox = await client.mailboxOpen(folderName);
        securityLogger.info(`Opened mailbox: ${folderName}`, { folderName, emailAddress });
        securityLogger.info(`Mailbox has ${mailbox.exists} messages`, { mailboxExists: mailbox.exists, emailAddress });

        let messages: number[] = [];
        const lastUid = config.lastEmailUid != null ? Number(config.lastEmailUid) : null;

        try {
          if (lastUid != null && lastUid > 0) {
            securityLogger.info(`Fetching emails with UID > ${lastUid}`, { lastUid, emailAddress });
            const searchResult = await client.search({ uid: `${lastUid + 1}:*` }, { uid: true });
            messages = Array.isArray(searchResult) ? searchResult : [];
          } else {
            if (mailbox.uidNext && mailbox.uidNext > 1) {
              const searchResult = await client.search({ uid: `1:${mailbox.uidNext - 1}` }, { uid: true });
              messages = Array.isArray(searchResult) ? searchResult : [];
            } else {
              const monthAgo = new Date();
              monthAgo.setDate(monthAgo.getDate() - 30);
              const searchResult = await client.search({ since: monthAgo }, { uid: true });
              messages = Array.isArray(searchResult) ? searchResult : [];
            }
          }
        } catch (searchError: unknown) {
          securityLogger.error('Search error, trying alternative method:', (searchError as Error).message);
          try {
            const allMessages = await client.search({ all: true }, { uid: true });
            messages = Array.isArray(allMessages) ? allMessages : [];
            if (lastUid != null && lastUid > 0) {
              messages = messages.filter((uid) => Number(uid) > lastUid);
            }
          } catch {
            messages = [];
          }
        }

        securityLogger.info(`Found ${messages.length} new emails`, { newEmailsCount: messages.length, emailAddress });

        let maxUid = lastUid ?? 0;

        for (const uid of messages) {
          try {
            const message = await client.fetchOne(uid, { source: true }, { uid: true });

            if (message && message.source) {
              const parsed = await simpleParser(message.source);
              const emailData = await this.parseEmail(parsed, { emailAddress });

              await this.storeIncomingEmail(emailData, {
                tenantId,
                propertyId,
                emailAddress,
                autoCreateGuest: config.autoCreateGuest ?? true,
                autoLinkConversation: config.autoLinkConversation ?? true,
              });

              fetchedCount++;
              maxUid = Math.max(maxUid, Number(uid));
            }
          } catch (error) {
            securityLogger.error(`Error processing email UID ${uid}:`, error);
          }
        }

        await db
          .update(sofiaEmailInboxConfig)
          .set({
            lastCheckedAt: new Date(),
            lastEmailUid: maxUid > 0 ? maxUid : null,
            updatedAt: new Date(),
          })
          .where(eq(sofiaEmailInboxConfig.id, configId));

        securityLogger.info(`Fetched ${fetchedCount} new emails for ${emailAddress}`, { fetchedCount, emailAddress });
      } finally {
        if (client) {
          await client.logout();
        }
      }

      return fetchedCount;
    } catch (error) {
      securityLogger.error(`Error fetching emails for config ${configId}:`, error);
      throw error;
    }
  }

  private async parseEmail(
    parsed: ParsedMail,
    config: { emailAddress: string }
  ): Promise<IncomingEmailData> {
    const fromAddress = Array.isArray(parsed.from) ? parsed.from[0] : parsed.from;
    const from = fromAddress?.value?.[0] || { address: '', name: '' };

    const toAddress = Array.isArray(parsed.to) ? parsed.to[0] : parsed.to;
    const to = toAddress?.value?.[0]?.address || config.emailAddress;

    const ccAddresses = Array.isArray(parsed.cc) ? parsed.cc : parsed.cc ? [parsed.cc] : [];
    const cc = ccAddresses.flatMap((addr) => addr?.value?.map((a) => a.address ?? '') || []);

    const bccAddresses = Array.isArray(parsed.bcc) ? parsed.bcc : parsed.bcc ? [parsed.bcc] : [];
    const bcc = bccAddresses.flatMap((addr) => addr?.value?.map((a) => a.address ?? '') || []);

    const attachments: EmailAttachment[] = (parsed.attachments || []).map((att) => ({
      filename: att.filename || 'unnamed',
      contentType: att.contentType || 'application/octet-stream',
      size: att.size || 0,
      contentId: att.contentId,
      cid: att.cid,
    }));

    let referencesStr: string | undefined;
    if (parsed.references) {
      referencesStr = Array.isArray(parsed.references)
        ? parsed.references.join(' ')
        : typeof parsed.references === 'string'
          ? parsed.references
          : undefined;
    }

    return {
      messageId: parsed.messageId || uuidv4(),
      inReplyTo: parsed.inReplyTo,
      references: referencesStr,
      from: { email: from.address, name: from.name || undefined },
      to,
      cc: cc.length > 0 ? cc : undefined,
      bcc: bcc.length > 0 ? bcc : undefined,
      subject: parsed.subject || '(No Subject)',
      htmlBody: parsed.html || undefined,
      textBody: parsed.text || undefined,
      attachments: attachments.length > 0 ? attachments : undefined,
      receivedAt: parsed.date || new Date(),
    };
  }

  private async storeIncomingEmail(
    emailData: IncomingEmailData,
    config: {
      tenantId: string;
      propertyId?: string;
      emailAddress: string;
      autoCreateGuest?: boolean;
      autoLinkConversation?: boolean;
    }
  ): Promise<void> {
    try {
      let guestId: string | undefined;

      if (config.autoCreateGuest) {
        const [guest] = await db
          .select()
          .from(guests)
          .where(and(eq(guests.tenantId, config.tenantId), eq(guests.email, emailData.from.email)))
          .limit(1);

        if (!guest) {
          const [newGuest] = await db
            .insert(guests)
            .values({
              tenantId: config.tenantId,
              email: emailData.from.email,
              firstName: emailData.from.name?.split(' ')[0] || undefined,
              lastName: emailData.from.name?.split(' ').slice(1).join(' ') || undefined,
            })
            .returning({ id: guests.id });
          guestId = newGuest?.id;
        } else {
          guestId = guest.id;
        }
      }

      const threadId = this.determineThreadId(emailData);

      const [existingThread] = await db
        .select()
        .from(sofiaEmailThreads)
        .where(
          and(eq(sofiaEmailThreads.tenantId, config.tenantId), eq(sofiaEmailThreads.threadId, threadId))
        )
        .limit(1);

      if (!existingThread) {
        await db.insert(sofiaEmailThreads).values({
          tenantId: config.tenantId,
          propertyId: config.propertyId ?? undefined,
          guestId: guestId,
          threadId,
          subject: emailData.subject,
          initialMessageId: emailData.messageId,
          lastEmailAt: emailData.receivedAt,
        });
      } else {
        await db
          .update(sofiaEmailThreads)
          .set({
            emailCount: (existingThread.emailCount ?? 1) + 1,
            lastEmailAt: emailData.receivedAt,
            updatedAt: new Date(),
          })
          .where(eq(sofiaEmailThreads.id, existingThread.id));
      }

      let conversationId: string | undefined;
      if (config.autoLinkConversation && guestId) {
        const [conversation] = await db
          .select()
          .from(aiConversations)
          .where(
            and(
              eq(aiConversations.tenantId, config.tenantId),
              eq(aiConversations.guestId, guestId),
              eq(aiConversations.channel, 'EMAIL'),
              eq(aiConversations.status, 'active')
            )
          )
          .orderBy(desc(aiConversations.createdAt))
          .limit(1);
        conversationId = conversation?.id;
      }

      const [existingEmail] = await db
        .select()
        .from(sofiaIncomingEmails)
        .where(
          and(
            eq(sofiaIncomingEmails.tenantId, config.tenantId),
            eq(sofiaIncomingEmails.messageId, emailData.messageId)
          )
        )
        .limit(1);

      if (existingEmail) {
        securityLogger.info(`Email with message_id ${emailData.messageId} already exists, skipping...`, { messageId: emailData.messageId, emailAddress: config.emailAddress });
        return;
      }

      await db.insert(sofiaIncomingEmails).values({
        id: uuidv4(),
        tenantId: config.tenantId,
        propertyId: config.propertyId ?? undefined,
        guestId: guestId,
        conversationId: conversationId,
        messageId: emailData.messageId,
        inReplyTo: emailData.inReplyTo ?? undefined,
        referencesHeader: emailData.references ?? undefined,
        threadId,
        fromEmail: emailData.from.email,
        fromName: emailData.from.name ?? undefined,
        toEmail: emailData.to,
        ccEmails: emailData.cc ?? [],
        bccEmails: emailData.bcc ?? [],
        subject: emailData.subject,
        htmlBody: emailData.htmlBody ?? undefined,
        textBody: emailData.textBody ?? undefined,
        attachments: emailData.attachments ? (emailData.attachments as unknown as Record<string, unknown>[]) : [],
        receivedAt: emailData.receivedAt,
        status: 'pending',
        metadata: {},
      });
    } catch (error) {
      securityLogger.error('Error storing incoming email:', error);
      throw error;
    }
  }

  private determineThreadId(emailData: IncomingEmailData): string {
    if (emailData.inReplyTo) return emailData.inReplyTo;
    if (emailData.references) {
      const refs = emailData.references.split(/\s+/);
      if (refs.length > 0) return refs[0];
    }
    return emailData.messageId;
  }

  async processPendingEmails(tenantId?: string): Promise<number> {
    try {
      const conditions = [eq(sofiaIncomingEmails.status, 'pending')];
      if (tenantId) conditions.push(eq(sofiaIncomingEmails.tenantId, tenantId));

      const pendingEmails = await db
        .select()
        .from(sofiaIncomingEmails)
        .where(and(...conditions))
        .orderBy(sofiaIncomingEmails.receivedAt)
        .limit(50);

      let processedCount = 0;

      for (const email of pendingEmails) {
        try {
          await this.processEmail(email);
          processedCount++;
        } catch (error) {
          securityLogger.error(`Error processing email ${email.id}:`, error);
          await db
            .update(sofiaIncomingEmails)
            .set({
              status: 'failed',
              errorMessage: error instanceof Error ? error.message : 'Unknown error',
              processedAt: new Date(),
              updatedAt: new Date(),
            })
            .where(eq(sofiaIncomingEmails.id, email.id));
        }
      }

      return processedCount;
    } catch (error) {
      securityLogger.error('Error processing pending emails:', error);
      throw error;
    }
  }

  private async processEmail(email: { id: string }): Promise<void> {
    await db
      .update(sofiaIncomingEmails)
      .set({
        status: 'processed',
        processedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(sofiaIncomingEmails.id, email.id));
  }

  async getActiveConfigs(): Promise<typeof sofiaEmailInboxConfig.$inferSelect[]> {
    return db
      .select()
      .from(sofiaEmailInboxConfig)
      .where(eq(sofiaEmailInboxConfig.isActive, true));
  }
}
