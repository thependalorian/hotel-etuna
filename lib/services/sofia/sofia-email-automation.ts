/**
 * Sofia automatic email dispatch from chat intent (quotation, confirmation, details).
 * Location: lib/services/sofia/sofia-email-automation.ts
 */

import { db } from '@/lib/db';
import { guests, properties } from '@/lib/db/schema';
import { and, eq } from 'drizzle-orm';
import type { AIResponse } from '@/lib/types/ai';
import type { ConversationContext } from '@/lib/types/ai';
import { EmailService } from '@/lib/services/sofia/EmailService';
import { SofiaEmailTemplateGenerator } from '@/lib/services/sofia/EmailTemplateGenerator';
import { securityLogger } from '@/lib/utils/security-logger';
import type { SofiaConversationTurn } from '@/lib/services/sofia/sofia-conversation-store';

export class SofiaEmailAutomation {
  constructor(
    private readonly emailService = new EmailService(),
    private readonly emailTemplateGenerator = new SofiaEmailTemplateGenerator(),
  ) {}

  async sendEmailAutomatically(
    context: ConversationContext,
    emailIntent: { needsEmail: boolean; type: string },
    guestEmail: string,
    conversationHistory: SofiaConversationTurn[],
    aiResponse: AIResponse,
  ): Promise<boolean> {
    if (!emailIntent.needsEmail || !guestEmail) {
      return false;
    }

    try {
      const emailContent = await this.generateEmailContent(
        emailIntent.type,
        context,
        conversationHistory,
        aiResponse,
      );

      await this.emailService.sendEmail(context.tenantId, {
        to: guestEmail,
        subject: emailContent.subject,
        htmlContent: emailContent.html,
        textContent: emailContent.text,
        propertyId: context.propertyId,
        metadata: {
          intent: emailIntent.type,
          conversation_session_id: context.sessionId,
          sent_automatically: true,
        },
      });

      return true;
    } catch (error) {
      securityLogger.error('Error sending email automatically:', error);
      return false;
    }
  }

  private async generateEmailContent(
    emailType: string,
    context: ConversationContext,
    _conversationHistory: SofiaConversationTurn[],
    aiResponse: AIResponse,
  ): Promise<{ subject: string; html: string; text: string }> {
    let propertyName = 'Hotel Etuna';
    if (context.propertyId) {
      try {
        const [property] = await db
          .select({ name: properties.name })
          .from(properties)
          .where(and(eq(properties.id, context.propertyId), eq(properties.tenantId, context.tenantId)))
          .limit(1);
        if (property) propertyName = property.name;
      } catch (error) {
        securityLogger.warn('Failed to fetch property name:', error);
      }
    }

    let subject = '';
    let body = '';

    switch (emailType) {
      case 'quotation':
        subject = `Quotation Request - ${propertyName}`;
        body = `Thank you for your interest in ${propertyName}!\n\n${aiResponse.response}\n\nIf you have any questions or would like to proceed with a booking, please don't hesitate to reach out. We look forward to hosting you!`;
        break;
      case 'confirmation':
        subject = `Booking Confirmation - ${propertyName}`;
        body = `Thank you for your booking with ${propertyName}!\n\n${aiResponse.response}\n\nWe look forward to welcoming you!`;
        break;
      case 'details':
        subject = `Information Request - ${propertyName}`;
        body = `Thank you for your inquiry about ${propertyName}!\n\n${aiResponse.response}\n\nIf you need any additional information, please feel free to contact us.`;
        break;
      default:
        subject = `Information from ${propertyName}`;
        body = `Thank you for contacting ${propertyName}!\n\n${aiResponse.response}\n\nWe're here to help with any questions you may have.`;
    }

    let recipientName: string | undefined;
    if (context.guestId) {
      try {
        const [guest] = await db
          .select({ firstName: guests.firstName, lastName: guests.lastName })
          .from(guests)
          .where(and(eq(guests.id, context.guestId), eq(guests.tenantId, context.tenantId)))
          .limit(1);
        if (guest) {
          recipientName = [guest.firstName, guest.lastName].filter(Boolean).join(' ').trim() || undefined;
        }
      } catch {
        recipientName = undefined;
      }
    }

    const bodyHtml = `<p>${body.replace(/\n\n/g, '</p><p>').replace(/\n/g, '<br>')}</p>`;

    const htmlContent = this.emailTemplateGenerator.generateHtmlTemplate({
      subject,
      body: bodyHtml,
      recipientName,
    });

    const textContent = this.emailTemplateGenerator.generateTextTemplate({
      subject,
      body,
      recipientName,
    });

    return {
      subject,
      html: htmlContent,
      text: textContent,
    };
  }
}
