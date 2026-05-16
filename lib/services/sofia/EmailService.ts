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
    const smtpSecure = smtpSecureRaw ? smtpSecureRaw === 'true' : smtpPort === 465;

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
      /** Must match SMTP-authenticated mailbox (e.g. Namecheap/Buffr). Override via EMAIL_SENDER_EMAIL. */
      const senderEmail = process.env.EMAIL_SENDER_EMAIL || 'concierge@buffr.ai';
      const senderName = process.env.EMAIL_SENDER_NAME || 'Sofia Concierge';

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
          console.warn('Failed to fetch property owner email for CC:', err);
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
      };

      const info = await this.transporter.sendMail(mailOptions);
      console.log('Email sent: %s', info.messageId);

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
        console.warn('Failed to log email to database (email was sent successfully):', dbError);
      }

      return { success: true, messageId: info.messageId };
    } catch (error) {
      console.error('Error sending email:', error);
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
        console.warn('Failed to log email failure to database:', dbError);
      }
      throw error;
    }
  }
}
