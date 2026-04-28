import { NextResponse } from 'next/server';
import { db, users, tenants, sofiaEmailLogs } from '@/lib/db';
import { eq } from 'drizzle-orm';
import bcryptjs from 'bcryptjs';
import * as z from 'zod';
import { v4 as uuidv4 } from 'uuid';
import { EmailService } from '@/lib/services/sofia/EmailService';
import { EmailTemplateService } from '@/lib/services/sofia/EmailTemplateService';

const registerSchema = z.object({
  name: z.string().min(2, { message: 'Name must be at least 2 characters.' }),
  email: z.string().email({ message: 'Invalid email address.' }),
  password: z.string().min(6, { message: 'Password must be at least 6 characters.' }),
});

// Generate a 6-digit OTP
function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const validation = registerSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json({ message: 'Invalid input.', errors: validation.error.flatten().fieldErrors }, { status: 400 });
    }

    const { name, email, password } = validation.data;

    const existingUsers = await db.select().from(users).where(eq(users.email, email)).limit(1);

    if (existingUsers.length > 0) {
      return NextResponse.json({ message: 'User with this email already exists.' }, { status: 409 });
    }

    const hashedPassword = await bcryptjs.hash(password, 10);
    
    // Generate OTP and set expiration (15 minutes from now)
    const otp = generateOTP();
    const otpExpiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

    // Create tenant then user (Neon serverless driver does not support transactions)
    const [newTenant] = await db.insert(tenants).values({ name: `${name}'s Team` }).returning();
    if (!newTenant) {
      return NextResponse.json({ message: 'Failed to create tenant.' }, { status: 500 });
    }

    const [newUser] = await db.insert(users).values({
      email,
      passwordHash: hashedPassword,
      firstName: name.split(' ')[0],
      lastName: name.split(' ').slice(1).join(' ') || null,
      role: 'owner',
      tenantId: newTenant.id,
      emailVerificationOtp: otp,
      emailVerificationOtpExpiresAt: otpExpiresAt,
    }).returning();
    if (!newUser) {
      return NextResponse.json({ message: 'Failed to create user.' }, { status: 500 });
    }

    const result = { newUser, newTenant };

    // Send verification email from Sofia (async - don't block response)
    const emailService = new EmailService();
    const templateService = new EmailTemplateService();
    
    // Generate verification email using template service
    const verificationEmail = templateService.generateVerificationEmail({
      recipientName: name,
      recipientEmail: email,
      otp: otp,
    });

    // Send email asynchronously (don't block registration response)
    emailService.sendEmail(result.newTenant.id, {
      to: email,
      subject: verificationEmail.subject,
      htmlContent: verificationEmail.html,
      textContent: verificationEmail.text,
      metadata: {
        type: 'email_verification',
        user_id: result.newUser.id,
        registration: true,
      },
    }).catch(async (error) => {
      // Log error but don't fail registration
      console.error('Failed to send verification email:', error);
      
      // Try to log the error to database for debugging
      try {
        await db.insert(sofiaEmailLogs).values({
          id: uuidv4(),
          tenantId: result.newTenant.id,
          recipientEmail: email,
          recipientName: name,
          subject: verificationEmail.subject,
          htmlContent: verificationEmail.html,
          textContent: verificationEmail.text,
          status: 'failed',
          errorMessage: error instanceof Error ? error.message : String(error),
          metadata: {
            type: 'email_verification',
            user_id: result.newUser.id,
            registration: true,
            error_details: {
              message: error instanceof Error ? error.message : String(error),
              stack: error instanceof Error ? error.stack : undefined,
              name: error instanceof Error ? error.name : undefined,
            },
          },
        });
      } catch (dbError) {
        console.error('Failed to log email error to database:', dbError);
      }
    });

    return NextResponse.json({ 
      message: 'User registered successfully. Please check your email for verification code.', 
      user: { id: result.newUser.id, email: result.newUser.email },
      requiresVerification: true,
    }, { status: 201 });

  } catch (error: unknown) {
    const err = error as { message?: string; code?: string; cause?: { code?: string } };
    console.error('Registration error:', error);
    console.error('Registration error details:', {
      message: err?.message,
      stack: err && typeof err === 'object' && 'stack' in err ? (err as Error).stack : undefined,
      name: err && typeof err === 'object' && 'name' in err ? (err as Error).name : undefined,
    });

    // Enhanced connection error detection for Neon/PostgreSQL
    const errorMessage = err?.message?.toLowerCase() || '';
    const isConnectionError =
      errorMessage.includes('fetch failed') ||
      errorMessage.includes('connect timeout') ||
      errorMessage.includes('connection timeout') ||
      errorMessage.includes('failed to connect') ||
      errorMessage.includes('ECONNREFUSED') ||
      errorMessage.includes('ENOTFOUND') ||
      errorMessage.includes('socket hang up') ||
      errorMessage.includes('und_conn_connect_timeout') ||
      errorMessage.includes('und_err_connect_timeout') ||
      err?.code === 'CONNECTION_TIMEOUT' ||
      err?.cause?.code === 'UND_ERR_CONNECT_TIMEOUT' ||
      err?.cause?.code === 'ECONNREFUSED';

    const publicMessage = isConnectionError
      ? 'Registration is temporarily unavailable due to a database connection issue. Please check your connection and try again in a few moments.'
      : err?.message || 'An unexpected error occurred. Please try again.';

    return NextResponse.json(
      {
        message: publicMessage,
        error: process.env.NODE_ENV === 'development' && !isConnectionError ? (err as Error)?.stack : undefined,
      },
      { status: isConnectionError ? 503 : 500 }
    );
  }
}
