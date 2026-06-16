/**
 * @fileoverview API route //api/auth/resend-otp
 * Location: /app/api/auth/resend-otp/route.ts
 */

import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { users } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { EmailService } from '@/lib/services/sofia/EmailService';
import { EmailTemplateService } from '@/lib/services/sofia/EmailTemplateService';
import { securityLogger } from '@/lib/utils/security-logger';
import * as z from 'zod';

const resendSchema = z.object({
  email: z.string().email({ message: 'Invalid email address.' }),
});

function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const validation = resendSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json({
        message: 'Invalid input.',
        errors: validation.error.flatten().fieldErrors,
      }, { status: 400 });
    }

    const { email } = validation.data;

    const [user] = await db.select().from(users).where(eq(users.email, email)).limit(1);

    if (!user) {
      return NextResponse.json({ message: 'User not found.' }, { status: 404 });
    }

    if (user.emailVerified) {
      return NextResponse.json({
        message: 'Email is already verified.',
        verified: true,
      }, { status: 200 });
    }

    const otp = generateOTP();
    const otpExpiresAt = new Date(Date.now() + 15 * 60 * 1000);

    await db
      .update(users)
      .set({
        emailVerificationOtp: otp,
        emailVerificationOtpExpiresAt: otpExpiresAt,
      })
      .where(eq(users.id, user.id));

    const emailService = new EmailService();
    const templateService = new EmailTemplateService();
    const resendEmail = templateService.generateResendOTPEmail({
      recipientName: [user.firstName, user.lastName].filter(Boolean).join(' ').trim() || email,
      recipientEmail: email,
      otp,
    });

    await emailService.sendEmail(user.tenantId ?? '', {
      to: email,
      subject: resendEmail.subject,
      htmlContent: resendEmail.html,
      textContent: resendEmail.text,
    });

    return NextResponse.json({
      message: 'Verification code has been resent to your email.',
    }, { status: 200 });
  } catch (error) {
    securityLogger.error('[ResendOTP] Resend OTP error', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack?.substring(0, 500) : undefined,
    });
    return NextResponse.json({
      message: 'An unexpected error occurred.',
    }, { status: 500 });
  }
}
