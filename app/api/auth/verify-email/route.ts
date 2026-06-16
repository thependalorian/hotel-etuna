/**
 * @fileoverview API route //api/auth/verify-email
 * Location: /app/api/auth/verify-email/route.ts
 */

import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { users } from '@/lib/db/schema';
import { eq, sql } from 'drizzle-orm';
import { resolveHubTenantId } from '@/lib/utils/hub-tenant';
import {
  linkGuestAccountForHubUser,
  normalizeAccountEmail,
} from '@/lib/services/booking/linkGuestAccount';
import * as z from 'zod';
import { securityLogger } from '@/lib/utils/security-logger';

const verifySchema = z.object({
  email: z.string().email({ message: 'Invalid email address.' }),
  otp: z.string().length(6, { message: 'OTP must be 6 digits.' }),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const validation = verifySchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json({
        message: 'Invalid input.',
        errors: validation.error.flatten().fieldErrors,
      }, { status: 400 });
    }

    const { otp } = validation.data;
    const email = normalizeAccountEmail(validation.data.email);

    const [user] = await db
      .select()
      .from(users)
      .where(sql`lower(${users.email}) = ${email}`)
      .limit(1);

    if (!user) {
      return NextResponse.json({ message: 'User not found.' }, { status: 404 });
    }

    if (user.emailVerified) {
      return NextResponse.json({
        message: 'Email is already verified.',
        verified: true,
      }, { status: 200 });
    }

    if (!user.emailVerificationOtp || user.emailVerificationOtp !== otp) {
      return NextResponse.json({
        message: 'Invalid verification code. Please check and try again.',
      }, { status: 400 });
    }

    if (
      !user.emailVerificationOtpExpiresAt ||
      new Date() > user.emailVerificationOtpExpiresAt
    ) {
      return NextResponse.json({
        message: 'Verification code has expired. Please request a new one.',
      }, { status: 400 });
    }

    await db
      .update(users)
      .set({
        emailVerified: true,
        emailVerificationOtp: null,
        emailVerificationOtpExpiresAt: null,
      })
      .where(eq(users.id, user.id));

    const hubTenantId = user.tenantId ?? (await resolveHubTenantId());
    await linkGuestAccountForHubUser({
      hubTenantId,
      email,
      firstName: user.firstName,
      lastName: user.lastName,
    });

    return NextResponse.json({
      message: 'Email verified successfully.',
      verified: true,
    }, { status: 200 });
  } catch (error) {
    securityLogger.error('[VerifyEmail] Email verification error', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack?.substring(0, 500) : undefined,
    });
    return NextResponse.json({
      message: 'An unexpected error occurred.',
    }, { status: 500 });
  }
}
