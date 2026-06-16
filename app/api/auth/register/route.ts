/**
 * @fileoverview API route //api/auth/register
 * Location: /app/api/auth/register/route.ts
 */

import { NextRequest, NextResponse } from 'next/server';
import { db, users, sofiaEmailLogs } from '@/lib/db';
import { eq, sql } from 'drizzle-orm';
import { resolveHubTenantId } from '@/lib/utils/hub-tenant';
import {
  linkGuestAccountForHubUser,
  normalizeAccountEmail,
} from '@/lib/services/booking/linkGuestAccount';
import bcryptjs from 'bcryptjs';
import * as z from 'zod';
import { v4 as uuidv4 } from 'uuid';
import { EmailService } from '@/lib/services/sofia/EmailService';
import { EmailTemplateService } from '@/lib/services/sofia/EmailTemplateService';
import { checkRateLimit } from '@/lib/utils/rate-limit';
import { rateLimitResponse } from '@/lib/utils/api-helpers';
import { passwordSchema } from '@/lib/validation/password';
import { isTurnstileConfigured, verifyTurnstileToken } from '@/lib/auth/verify-turnstile';
import { securityLogger } from '@/lib/utils/security-logger';

const registerSchema = z.object({
  name: z.string().min(2, { message: 'Name must be at least 2 characters.' }).max(120),
  email: z.string().email({ message: 'Invalid email address.' }),
  password: passwordSchema,
  turnstileToken: z.string().optional(),
});

// Generate a 6-digit OTP
function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export async function POST(request: NextRequest) {
  try {
    const rateLimitResult = await checkRateLimit(request);
    if (!rateLimitResult.allowed) {
      return rateLimitResponse(rateLimitResult);
    }

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ message: 'Invalid JSON in request body.' }, { status: 400 });
    }
    const validation = registerSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json({ message: 'Invalid input.', errors: validation.error.flatten().fieldErrors }, { status: 400 });
    }

    const { name, password, turnstileToken } = validation.data;
    const email = normalizeAccountEmail(validation.data.email);

    if (isTurnstileConfigured()) {
      const remoteIp =
        request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
        request.headers.get('x-real-ip');
      const turnstileOk = await verifyTurnstileToken(turnstileToken, remoteIp);
      if (!turnstileOk) {
        return NextResponse.json(
          { message: 'Security verification failed. Please refresh and try again.' },
          { status: 400 },
        );
      }
    }

    const existingUsers = await db
      .select({ id: users.id })
      .from(users)
      .where(sql`lower(${users.email}) = ${email}`)
      .limit(1);

    if (existingUsers.length > 0) {
      return NextResponse.json(
        { message: 'If this email is not already registered, check your inbox to verify your account.' },
        { status: 409 },
      );
    }

    const hashedPassword = await bcryptjs.hash(password, 10);
    
    // Generate OTP and set expiration (15 minutes from now)
    const otp = generateOTP();
    const otpExpiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

    const hubTenantId = await resolveHubTenantId();

    const [newUser] = await db.insert(users).values({
      email,
      passwordHash: hashedPassword,
      firstName: name.split(' ')[0],
      lastName: name.split(' ').slice(1).join(' ') || null,
      role: 'guest',
      tenantId: hubTenantId,
      emailVerificationOtp: otp,
      emailVerificationOtpExpiresAt: otpExpiresAt,
    }).returning();
    if (!newUser) {
      return NextResponse.json({ message: 'Failed to create user.' }, { status: 500 });
    }

    await linkGuestAccountForHubUser({
      hubTenantId,
      email,
      firstName: newUser.firstName,
      lastName: newUser.lastName,
    });

    const result = { hubTenantId };

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
    emailService.sendEmail(result.hubTenantId, {
      to: email,
      subject: verificationEmail.subject,
      htmlContent: verificationEmail.html,
      textContent: verificationEmail.text,
      metadata: {
        type: 'email_verification',
        user_id: newUser.id,
        registration: true,
      },
    }).catch(async (error) => {
      // Log error but don't fail registration
      securityLogger.error('[Register] Failed to send verification email', {
        email,
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack?.substring(0, 500) : undefined,
      });
      
      // Try to log the error to database for debugging
      try {
        await db.insert(sofiaEmailLogs).values({
          id: uuidv4(),
          tenantId: result.hubTenantId,
          recipientEmail: email,
          recipientName: name,
          subject: verificationEmail.subject,
          htmlContent: verificationEmail.html,
          textContent: verificationEmail.text,
          status: 'failed',
          errorMessage: error instanceof Error ? error.message : String(error),
          metadata: {
            type: 'email_verification',
            user_id: newUser.id,
            registration: true,
            error_details: {
              message: error instanceof Error ? error.message : String(error),
              stack: error instanceof Error ? error.stack : undefined,
              name: error instanceof Error ? error.name : undefined,
            },
          },
        });
      } catch (dbError) {
        securityLogger.error('[Register] Failed to log email error to database', {
          error: dbError instanceof Error ? dbError.message : String(dbError),
          stack: dbError instanceof Error ? dbError.stack?.substring(0, 500) : undefined,
        });
      }
    });

    return NextResponse.json({
      message: 'User registered successfully. Please check your email for verification code.',
      requiresVerification: true,
      ...(process.env.E2E_TURNSTILE_BYPASS === '1' ? { e2eOtp: otp } : {}),
    }, { status: 201 });

  } catch (error: unknown) {
    const err = error as { message?: string; code?: string; cause?: { code?: string } };
    securityLogger.error('[Register] Registration error', {
      message: err?.message,
      code: err?.code,
      cause: err?.cause,
      stack: err && typeof err === 'object' && 'stack' in err ? (err as Error).stack?.substring(0, 500) : undefined,
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
      : 'An unexpected error occurred. Please try again.';

    return NextResponse.json(
      { message: publicMessage },
      { status: isConnectionError ? 503 : 500 }
    );
  }
}
