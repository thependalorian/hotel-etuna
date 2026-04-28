import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { users } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import * as z from 'zod';
import bcryptjs from 'bcryptjs';

const verifyOldAccountSchema = z.object({
  email: z.string().email({ message: 'Invalid email address.' }),
  password: z.string().min(6, { message: 'Password must be at least 6 characters.' }),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const validation = verifyOldAccountSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json({
        message: 'Invalid input.',
        errors: validation.error.flatten().fieldErrors,
      }, { status: 400 });
    }

    const { email, password } = validation.data;

    const [user] = await db.select().from(users).where(eq(users.email, email)).limit(1);

    if (!user) {
      return NextResponse.json({ message: 'User not found.' }, { status: 404 });
    }

    const passwordMatch = await bcryptjs.compare(password, user.passwordHash);
    if (!passwordMatch) {
      return NextResponse.json({ message: 'Invalid password.' }, { status: 401 });
    }

    if (user.emailVerified) {
      return NextResponse.json({
        message: 'Email is already verified.',
        verified: true,
      }, { status: 200 });
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
      message: 'Account verified successfully. You can now log in.',
      verified: true,
    }, { status: 200 });
  } catch (error) {
    console.error('Verify old account error:', error);
    return NextResponse.json({
      message: 'An unexpected error occurred.',
    }, { status: 500 });
  }
}
