/**
 * @fileoverview API route //api/sofia/email
 * Location: /app/api/sofia/email/route.ts
 */

import { NextRequest } from 'next/server';
import {
  withPlatformApiAuth,
  errorResponse,
  successResponse,
} from '@/lib/utils/api-helpers';
import { EmailService } from '@/lib/services/sofia/EmailService';
import { SofiaEmailTemplateGenerator } from '@/lib/services/sofia/EmailTemplateGenerator';
import { securityLogger } from '@/lib/utils/security-logger';

const emailService = new EmailService();
const templateGenerator = new SofiaEmailTemplateGenerator();

export async function POST(request: NextRequest) {
  return withPlatformApiAuth(
    request,
    async (req, user) => {
      if (!user.tenantId) {
        return errorResponse('Unauthorized', 401, 'UNAUTHORIZED');
      }

      try {
        const body = await req.json();
        const { to, subject, emailBody, ctaLink, ctaText, templateId, metadata } = body;

        if (!to || !subject || !emailBody) {
          return errorResponse('Missing required fields: to, subject, emailBody', 400, 'VALIDATION_ERROR');
        }

        const htmlContent = templateGenerator.generateHtmlTemplate({
          subject,
          body: emailBody,
          ctaLink,
          ctaText,
        });
        const textContent = templateGenerator.generateTextTemplate({
          subject,
          body: emailBody,
          ctaLink,
          ctaText,
        });

        const emailResult = await emailService.sendEmail(user.tenantId, {
          to,
          subject,
          htmlContent,
          textContent,
          templateId,
          metadata,
        });

        return successResponse({
          message: 'Email sent successfully',
          messageId: emailResult.messageId,
        });
      } catch (error) {
        securityLogger.error('Error sending email:', error);
        return errorResponse('Internal server error', 500, 'INTERNAL_ERROR');
      }
    },
    { rateLimit: true }
  );
}
