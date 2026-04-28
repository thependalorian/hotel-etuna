import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { users } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import * as z from 'zod';

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

    const { email, otp } = validation.data;

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

    return NextResponse.json({
      message: 'Email verified successfully.',
      verified: true,
    }, { status: 200 });
  } catch (error) {
    console.error('Email verification error:', error);
    return NextResponse.json({
      message: 'An unexpected error occurred.',
    }, { status: 500 });
  }
}
