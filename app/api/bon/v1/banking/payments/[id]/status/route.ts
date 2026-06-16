/**
 * @fileoverview API route //api/bon/v1/banking/payments/[id]/status
 * Location: /app/api/bon/v1/banking/payments/[id]/status/route.ts
 */

/**
 * Namibia Open Banking — Get Payment Status (PIS Use Case 3)
 *
 * Purpose: Track a previously initiated payment by PaymentId.
 * Location: app/api/bon/v1/banking/payments/[id]/status/route.ts
 *
 * GET Authorization: Bearer (scope banking:payments.read)
 * Response: { data: { paymentId, paymentReference, status, amount, currency, ... } }
 */

import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { PaymentInitiationService } from '@/lib/services/openbanking/PaymentInitiationService';
import { db, obApiTransactions } from '@/lib/db';
import { securityLogger } from '@/lib/utils/security-logger';
import { entityId } from '@/lib/validation/entity-ids';

export const dynamic = 'force-dynamic';

type RouteParams = { params: Promise<{ id: string }> };

function extractBearerToken(request: NextRequest): string | null {
  const header = request.headers.get('authorization');
  if (!header?.startsWith('Bearer ')) return null;
  return header.slice(7).trim();
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  const startTime = Date.now();
  const requestId = crypto.randomUUID();
  const { id } = await params;

  if (!entityId('Invalid payment ID').safeParse(id).success) {
    return NextResponse.json(
      { error: 'invalid_request', error_description: 'Invalid payment ID' },
      { status: 400 }
    );
  }

  const accessToken = extractBearerToken(request);
  if (!accessToken) {
    return NextResponse.json(
      { error: 'invalid_token', error_description: 'Bearer access token required' },
      { status: 401 }
    );
  }

  try {
    const result = await PaymentInitiationService.getPaymentStatus({
      accessToken,
      paymentId: id,
    });

    const responseTimeMs = Date.now() - startTime;
    await logApiTransaction(requestId, 200, responseTimeMs);

    return NextResponse.json(result, {
      status: 200,
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
    const status = message.includes('NOT_FOUND') ? 404 : message.includes('UNAUTHORIZED') ? 403 : 500;
    await logApiTransaction(requestId, status, responseTimeMs, message.split(':')[0]);
    securityLogger.error('[BON PIS Payment Status]', { requestId, paymentId: id, message });

    return NextResponse.json(
      { error: 'payment_status_error', error_description: message },
      { status }
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
      endpoint: '/bon/v1/banking/payments/{id}/status',
      httpMethod: 'GET',
      httpStatusCode: statusCode,
      responseTimeMs,
      errorCode: errorCode ?? null,
    });
  } catch {
    // Non-blocking
  }
}
