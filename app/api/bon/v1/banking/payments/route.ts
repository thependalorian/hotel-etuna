/**
 * Namibia Open Banking — Make Payment (PIS)
 *
 * Purpose: TPP-initiated payment per Namibian Open Banking Standards v1.0 §9.2.5 Use Case 1.
 * Location: app/api/bon/v1/banking/payments/route.ts
 *
 * POST Authorization: Bearer access_token (scope banking:payments.write)
 * POST body: payerAccountId, payeeIdentifier, payeeName, payeeAccountType, amount, currency,
 *            paymentStream (NRTC|EnCR), authMethod, authValue
 * Response: { data: { paymentId, paymentReference, status, estimatedSettlement } }
 *
 * Compliance: PSD-12 step-up 2FA per initiation; BoN OB Standards Final Reference Edition.
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import crypto from 'crypto';
import { PaymentInitiationService } from '@/lib/services/openbanking/PaymentInitiationService';
import { db, obApiTransactions } from '@/lib/db';
import { securityLogger } from '@/lib/utils/security-logger';

export const dynamic = 'force-dynamic';

const makePaymentSchema = z.object({
  payerAccountId: z.string().uuid(),
  payeeIdentifier: z.string().min(3).max(128),
  payeeName: z.string().min(1).max(140),
  payeeAccountType: z.enum(['bank', 'ewallet', 'card']),
  amount: z.number().positive().max(1_000_000),
  currency: z.literal('NAD'),
  reference: z.string().max(64).optional(),
  description: z.string().max(500).optional(),
  paymentStream: z.enum(['NRTC', 'EnCR']),
  authMethod: z.enum(['otp_sms', 'biometric', 'app_pin']),
  authValue: z.string().min(4).max(256),
});

function extractBearerToken(request: NextRequest): string | null {
  const header = request.headers.get('authorization');
  if (!header?.startsWith('Bearer ')) return null;
  return header.slice(7).trim();
}

function mapPisError(message: string): { status: number; code: string; description: string } {
  if (message.includes('AUTHENTICATION_FAILED')) {
    return { status: 403, code: 'STEP_UP_REQUIRED', description: message };
  }
  if (message.includes('UNAUTHORIZED')) {
    return { status: 403, code: 'forbidden', description: message };
  }
  if (message.includes('INSUFFICIENT_FUNDS')) {
    return { status: 402, code: 'insufficient_funds', description: message };
  }
  if (message.includes('INVALID_')) {
    return { status: 400, code: 'invalid_request', description: message };
  }
  return { status: 500, code: 'server_error', description: 'Payment initiation failed' };
}

export async function POST(request: NextRequest) {
  const startTime = Date.now();
  const requestId = crypto.randomUUID();

  try {
    const accessToken = extractBearerToken(request);
    if (!accessToken) {
      return NextResponse.json(
        { error: 'invalid_token', error_description: 'Bearer access token required' },
        { status: 401 }
      );
    }

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: 'invalid_request', error_description: 'Invalid JSON body' },
        { status: 400 }
      );
    }

    const parsed = makePaymentSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        {
          error: 'invalid_request',
          error_description: 'Validation failed',
          details: parsed.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    const result = await PaymentInitiationService.makePayment({
      accessToken,
      ...parsed.data,
    });

    const responseTimeMs = Date.now() - startTime;
    await logApiTransaction(requestId, 201, responseTimeMs);

    return NextResponse.json(result, {
      status: 201,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-store',
        'ParticipantId': 'API000001',
        'x-v': '1',
      },
    });
  } catch (error) {
    const responseTimeMs = Date.now() - startTime;
    const message = error instanceof Error ? error.message : 'Unknown error';
    const mapped = mapPisError(message);
    await logApiTransaction(requestId, mapped.status, responseTimeMs, mapped.code);
    securityLogger.error('[BON PIS Make Payment]', { requestId, message });

    return NextResponse.json(
      { error: mapped.code, error_description: mapped.description },
      { status: mapped.status }
    );
  }
}

async function logApiTransaction(
  requestId: string,
  statusCode: number,
  responseTimeMs: number,
  errorCode?: string
) {
  try {
    await db.insert(obApiTransactions).values({
      requestId,
      endpoint: '/bon/v1/banking/payments',
      httpMethod: 'POST',
      httpStatusCode: statusCode,
      responseTimeMs,
      errorCode: errorCode ?? null,
    });
  } catch {
    // Non-blocking audit
  }
}
