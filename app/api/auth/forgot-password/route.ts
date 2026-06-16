/**
 * @fileoverview API route //api/auth/forgot-password
 * Location: /app/api/auth/forgot-password/route.ts
 */

import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { users } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { EmailService } from '@/lib/services/sofia/EmailService';
import { EmailTemplateService } from '@/lib/services/sofia/EmailTemplateService';
import { securityLogger } from '@/lib/utils/security-logger';
import * as z from 'zod';
import crypto from 'crypto';

const forgotPasswordSchema = z.object({
  email: z.string().email({ message: 'Invalid email address.' }),
});

function generateResetToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const validation = forgotPasswordSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json({
        message: 'Invalid input.',
        errors: validation.error.flatten().fieldErrors,
      }, { status: 400 });
    }

    const { email } = validation.data;

    const [user] = await db.select().from(users).where(eq(users.email, email)).limit(1);

    if (user) {
      const resetToken = generateResetToken();
      const tokenExpiresAt = new Date(Date.now() + 60 * 60 * 1000);

      await db
        .update(users)
        .set({
          passwordResetToken: resetToken,
          passwordResetTokenExpiresAt: tokenExpiresAt,
        })
        .where(eq(users.id, user.id));

      const baseUrl = process.env.NEXTAUTH_URL || 'https://hoteletuna.com';
      const resetLink = `${baseUrl}/reset-password?token=${resetToken}`;

      const emailService = new EmailService();
      const templateService = new EmailTemplateService();
      const resetEmail = templateService.generatePasswordResetEmail({
        recipientName: [user.firstName, user.lastName].filter(Boolean).join(' ').trim() || email,
        recipientEmail: email,
        resetLink,
      });

      emailService
        .sendEmail(user.tenantId ?? '', {
          to: email,
          subject: resetEmail.subject,
          htmlContent: resetEmail.html,
          textContent: resetEmail.text,
        })
        .catch((err) => {
          securityLogger.error('[ForgotPassword] Failed to send password reset email', {
            email,
            error: err instanceof Error ? err.message : String(err),
            stack: err instanceof Error ? err.stack?.substring(0, 500) : undefined,
          });
        });
    }

    return NextResponse.json({
      message: "If an account with that email exists, we've sent a password reset link.",
    }, { status: 200 });
  } catch (error) {
    securityLogger.error('[ForgotPassword] Forgot password error', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack?.substring(0, 500) : undefined,
    });
    return NextResponse.json({
      message: 'An unexpected error occurred.',
    }, { status: 500 });
  }
}
