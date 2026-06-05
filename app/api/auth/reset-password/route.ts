import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { users } from '@/lib/db/schema';
import { and, eq, gt } from 'drizzle-orm';
import { EmailService } from '@/lib/services/sofia/EmailService';
import { EmailTemplateService } from '@/lib/services/sofia/EmailTemplateService';
import bcryptjs from 'bcryptjs';
import * as z from 'zod';
import { securityLogger } from '@/lib/utils/security-logger.client';

const resetPasswordSchema = z.object({
  token: z.string().min(1, { message: 'Reset token is required.' }),
  password: z.string().min(6, { message: 'Password must be at least 6 characters.' }),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const validation = resetPasswordSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json({
        message: 'Invalid input.',
        errors: validation.error.flatten().fieldErrors,
      }, { status: 400 });
    }

    const { token, password } = validation.data;

    const [user] = await db
      .select()
      .from(users)
      .where(
        and(
          eq(users.passwordResetToken, token),
          gt(users.passwordResetTokenExpiresAt, new Date())
        )
      )
      .limit(1);

    if (!user) {
      return NextResponse.json({
        message: 'Invalid or expired reset token. Please request a new password reset link.',
      }, { status: 400 });
    }

    const hashedPassword = await bcryptjs.hash(password, 10);

    await db
      .update(users)
      .set({
        passwordHash: hashedPassword,
        passwordResetToken: null,
        passwordResetTokenExpiresAt: null,
      })
      .where(eq(users.id, user.id));

    const emailService = new EmailService();
    const templateService = new EmailTemplateService();
    const notificationEmail = templateService.generatePasswordChangeNotificationEmail({
      recipientName: [user.firstName, user.lastName].filter(Boolean).join(' ').trim() || user.email,
      recipientEmail: user.email,
    });

    emailService
      .sendEmail(user.tenantId ?? '', {
        to: user.email,
        subject: notificationEmail.subject,
        htmlContent: notificationEmail.html,
        textContent: notificationEmail.text,
      })
      .catch((err) => {
        securityLogger.error('[ResetPassword] Failed to send password change notification', {
          email: user.email,
          error: err instanceof Error ? err.message : String(err),
          stack: err instanceof Error ? err.stack?.substring(0, 500) : undefined,
        });
      });

    return NextResponse.json({
      message: 'Password has been reset successfully.',
      success: true,
    }, { status: 200 });
  } catch (error) {
    securityLogger.error('[ResetPassword] Reset password error', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack?.substring(0, 500) : undefined,
    });
    return NextResponse.json({
      message: 'An unexpected error occurred.',
    }, { status: 500 });
  }
}
