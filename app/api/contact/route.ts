/**
 * Contact Form Submission
 *
 * Purpose: Accept public contact form submissions and forward by email.
 * Location: /app/api/contact/route.ts
 * Rate limit: 5 per hour per IP (abuse protection)
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { checkRateLimit } from '@/lib/utils/rate-limit';
import { securityLogger } from '@/lib/utils/security-logger';
import { EmailService } from '@/lib/services/sofia/EmailService';
import { brand } from '@/lib/copy/brand';
import { contactFormRecipient } from '@/lib/copy/contact-emails';

const contactSchema = z.object({
  firstName: z.string().min(1).max(100),
  lastName: z.string().min(1).max(100),
  email: z.string().email().max(255),
  phone: z.string().max(50).optional(),
  subject: z.string().min(1).max(200),
  message: z.string().min(10).max(2000),
});

export async function POST(req: NextRequest) {
  const rateLimitResult = await checkRateLimit(req);
  if (!rateLimitResult.allowed) {
    return NextResponse.json(
      { success: false, error: { message: 'Too many requests. Please try again later.' } },
      { status: 429 }
    );
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { success: false, error: { message: 'Invalid request body.' } },
      { status: 400 }
    );
  }

  const parsed = contactSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { success: false, error: { message: 'Invalid input.', details: parsed.error.issues } },
      { status: 400 }
    );
  }

  const { firstName, lastName, email, phone, subject, message } = parsed.data;
  const hubTenantId = process.env.HUB_TENANT_ID;

  const recipientEmail = process.env.EMAIL_CONTACT_TO ?? process.env.EMAIL_SENDER_EMAIL ?? 'frontdesk@hoteletuna.com';

  try {
    const emailService = new EmailService();
    await emailService.sendEmail(hubTenantId ?? '', {
      to: recipientEmail,
      subject: `Contact form: ${subject}`,
      htmlContent: `
        <h2>New contact form submission</h2>
        <p><strong>Name:</strong> ${firstName} ${lastName}</p>
        <p><strong>Email:</strong> <a href="mailto:${email}">${email}</a></p>
        ${phone ? `<p><strong>Phone:</strong> ${phone}</p>` : ''}
        <p><strong>Subject:</strong> ${subject}</p>
        <hr />
        <p><strong>Message:</strong></p>
        <p style="white-space:pre-wrap">${message.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</p>
      `,
      textContent: `Contact form: ${subject}\n\nName: ${firstName} ${lastName}\nEmail: ${email}${phone ? `\nPhone: ${phone}` : ''}\n\nMessage:\n${message}`,
    });

    securityLogger.info('[Contact] Form submission forwarded', { email, subject });
    return NextResponse.json({ success: true, message: 'Thank you — we will be in touch within 24 hours.' });
  } catch (err) {
    securityLogger.error('[Contact] Failed to send contact form email', err);
    return NextResponse.json(
      {
        success: false,
        error: {
          message: `Failed to send message. Please email us directly at ${brand.emailFrontDesk}.`,
        },
      },
      { status: 500 },
    );
  }
}
