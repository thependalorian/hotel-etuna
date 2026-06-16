/**
 * @fileoverview API route //api/auth/check-email-verified
 * Location: /app/api/auth/check-email-verified/route.ts
 */

import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { users } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { securityLogger } from '@/lib/utils/security-logger';
import * as z from 'zod';

const checkSchema = z.object({
  email: z.string().email({ message: 'Invalid email address.' }),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const validation = checkSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json({
        message: 'Invalid input.',
        errors: validation.error.flatten().fieldErrors,
      }, { status: 400 });
    }

    const { email } = validation.data;

    const [user] = await db
      .select({
        emailVerified: users.emailVerified,
        emailVerificationOtp: users.emailVerificationOtp,
      })
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    if (!user) {
      return NextResponse.json({
        verified: false,
        message: 'User not found',
      }, { status: 200 });
    }

    return NextResponse.json({
      verified: user.emailVerified ?? false,
      hasOtp: !!user.emailVerificationOtp,
    }, { status: 200 });
  } catch (error) {
    securityLogger.error('[CheckEmailVerified] Check email verified error', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack?.substring(0, 500) : undefined,
    });
    return NextResponse.json({
      verified: false,
      message: 'An unexpected error occurred.',
    }, { status: 500 });
  }
}
