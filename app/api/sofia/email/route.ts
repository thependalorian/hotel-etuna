import { NextResponse, NextRequest } from 'next/server';
import { EmailService } from '@/lib/services/sofia/EmailService';
import { SofiaEmailTemplateGenerator } from '@/lib/services/sofia/EmailTemplateGenerator';
import { getAuthenticatedUser } from '@/lib/utils/api-helpers';
import { securityLogger } from '@/lib/utils/security-logger.client';

const emailService = new EmailService();
const templateGenerator = new SofiaEmailTemplateGenerator();

export async function POST(request: NextRequest) {
  const user = await getAuthenticatedUser(request);

  if (!user || !user.tenantId) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { to, subject, emailBody, ctaLink, ctaText, templateId, metadata } = body;

    if (!to || !subject || !emailBody) {
      return NextResponse.json({ message: 'Missing required fields: to, subject, emailBody' }, { status: 400 });
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

    const emailResult = await emailService.sendEmail(user.tenantId ?? '', {
      to,
      subject,
      htmlContent,
      textContent,
      templateId,
      metadata,
    });

    return NextResponse.json({ message: 'Email sent successfully', messageId: emailResult.messageId }, { status: 200 });
  } catch (error) {
    securityLogger.error('Error sending email:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}
