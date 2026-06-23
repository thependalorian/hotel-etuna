/**
 * EmailService - Send and log emails using Drizzle
 * Purpose: SMTP sending and Sofia email logging
 * Location: lib/services/sofia/EmailService.ts
 */

import { db } from '@/lib/db';
import { properties, users, sofiaEmailLogs } from '@/lib/db/schema';
import { and, eq } from 'drizzle-orm';
import { v4 as uuidv4 } from 'uuid';
import nodemailer from 'nodemailer';
import { brand } from '@/lib/copy/brand';
import { securityLogger } from '@/lib/utils/security-logger';

/** Guest-facing mail must never send from @buffr.ai — rebrand guard. */
function resolveGuestSenderEmail(): string {
  const configured = process.env.EMAIL_SENDER_EMAIL?.trim().toLowerCase();
  if (!configured || configured.endsWith('@buffr.ai')) {
    if (configured?.endsWith('@buffr.ai')) {
      securityLogger.warn('EMAIL_SENDER_EMAIL uses @buffr.ai; using frontdesk@hoteletuna.com for guest mail');
    }
    return brand.emailFrontDesk;
  }
  return configured;
}

export type EmailAttachment = {
  filename: string;
  content: Buffer | string;
  contentType?: string;
};

interface EmailData {
  to: string;
  subject: string;
  htmlContent: string;
  textContent: string;
  cc?: string[];
  bcc?: string[];
  propertyId?: string;
  templateId?: string;
  metadata?: Record<string, unknown>;
  attachments?: EmailAttachment[];
}

export class EmailService {
  private transporter: nodemailer.Transporter | null = null;

  constructor() {}

  private async initializeTransporter() {
    const smtpUser =
      process.env.NAMECHEAP_EMAIL ??
      process.env.EMAIL_USERNAME ??
      process.env.EMAIL_ADDRESS ??
      process.env.EMAIL_SMTP_USER ??
      process.env.SMTP_USER;
    const smtpPass =
      process.env.NAMECHEAP_EMAIL_PASSWORD ??
      process.env.EMAIL_PASSWORD ??
      process.env.EMAIL_SMTP_PASS ??
      process.env.SMTP_PASS ??
      process.env.SMTP_PASSWORD;
    const smtpHost =
      process.env.NAMECHEAP_SMTP_HOST ??
      process.env.EMAIL_SMTP_HOST ??
      process.env.SMTP_HOST ??
      'mail.privateemail.com';
    const smtpPort = parseInt(
      process.env.NAMECHEAP_SMTP_PORT ?? process.env.EMAIL_SMTP_PORT ?? process.env.SMTP_PORT ?? '465',
      10
    );
    const smtpSecureRaw = process.env.EMAIL_SMTP_SECURE ?? process.env.SMTP_SECURE;
    // Reason: port 465 is implicit TLS and MUST use secure:true — a stray EMAIL_SMTP_SECURE=false
    // would otherwise break the handshake. 587/25 are STARTTLS (secure:false) and honour the flag.
    const smtpSecure = smtpPort === 465 ? true : smtpSecureRaw === 'true';

    if (!smtpUser || !smtpPass || smtpUser === 'your_mailtrap_username' || smtpPass === 'your_mailtrap_password') {
      throw new Error(
        'SMTP credentials not configured. Set NAMECHEAP_EMAIL/NAMECHEAP_EMAIL_PASSWORD, EMAIL_ADDRESS/EMAIL_PASSWORD, or SMTP_USER/SMTP_PASS.'
      );
    }

    this.transporter = nodemailer.createTransport({
      host: smtpHost,
      port: smtpPort,
      secure: smtpSecure,
      auth: { user: smtpUser, pass: smtpPass },
    });
  }

  async sendEmail(tenantId: string, data: EmailData) {
    if (!data.to?.trim()) {
      throw new Error('No recipients defined');
    }
    if (!data.subject?.trim()) {
      throw new Error('Email subject is required');
    }

    if (!this.transporter) {
      await this.initializeTransporter();
      if (!this.transporter) throw new Error('Email transporter not initialized.');
    }

    try {
      /** Must match SMTP-authenticated mailbox. Never @buffr.ai on guest surfaces. */
      const senderEmail = resolveGuestSenderEmail();
      const senderName = process.env.EMAIL_SENDER_NAME || `${brand.name} Concierge`;

      const ccRecipients = data.cc ?? [];
      if (data.propertyId && ccRecipients.length === 0) {
        try {
          const [property] = await db
            .select({ ownerId: properties.ownerId })
            .from(properties)
            .where(and(eq(properties.id, data.propertyId), eq(properties.tenantId, tenantId)))
            .limit(1);

          if (property?.ownerId) {
            const [owner] = await db
              .select({ email: users.email })
              .from(users)
              .where(and(eq(users.id, property.ownerId), eq(users.tenantId, tenantId)))
              .limit(1);
            if (owner?.email) ccRecipients.push(owner.email);
          }
        } catch (err) {
          securityLogger.warn('Failed to fetch property owner email for CC:', err);
        }
      }

      const mailOptions: nodemailer.SendMailOptions = {
        from: `"${senderName}" <${senderEmail}>`,
        to: data.to,
        subject: data.subject,
        html: data.htmlContent,
        text: data.textContent,
        ...(ccRecipients.length > 0 && { cc: ccRecipients }),
        ...(data.bcc && data.bcc.length > 0 && { bcc: data.bcc }),
        ...(data.attachments?.length
          ? {
              attachments: data.attachments.map((att) => ({
                filename: att.filename,
                content: att.content,
                contentType: att.contentType ?? 'application/octet-stream',
              })),
            }
          : {}),
      };

      const info = await this.transporter.sendMail(mailOptions);
      securityLogger.info('Email sent', { messageId: info.messageId, to: data.to, subject: data.subject, tenantId });

      try {
        await db.insert(sofiaEmailLogs).values({
          id: uuidv4(),
          tenantId,
          recipientEmail: data.to,
          recipientName: data.to,
          subject: data.subject,
          htmlContent: data.htmlContent,
          textContent: data.textContent,
          status: 'sent',
          sentAt: new Date(),
          templateId: data.templateId ?? null,
          metadata: {
            ...(data.metadata && typeof data.metadata === 'object' && !Array.isArray(data.metadata) ? data.metadata : {}),
            cc_recipients: ccRecipients,
            bcc_recipients: data.bcc ?? [],
            property_id: data.propertyId,
          },
        });
      } catch (dbError) {
        securityLogger.warn('Failed to log email to database (email was sent successfully):', dbError);
      }

      return { success: true, messageId: info.messageId };
    } catch (error) {
      securityLogger.error('Error sending email:', error);
      try {
        await db.insert(sofiaEmailLogs).values({
          id: uuidv4(),
          tenantId,
          recipientEmail: data.to,
          recipientName: data.to,
          subject: data.subject,
          htmlContent: data.htmlContent,
          textContent: data.textContent,
          status: 'failed',
          errorMessage: (error as Error).message,
          sentAt: new Date(),
          templateId: data.templateId ?? null,
          metadata: (data.metadata as Record<string, unknown>) ?? {},
        });
      } catch (dbError) {
        securityLogger.warn('Failed to log email failure to database:', dbError);
      }
      throw error;
    }
  }
}
