/**
 * Namibia Open Banking — List Beneficiaries (PIS Use Case 2)
 *
 * Purpose: Return payees the account holder pays frequently (TPP presentation aid).
 * Location: app/api/bon/v1/banking/beneficiaries/route.ts
 *
 * GET Authorization: Bearer (scope banking:payments.read)
 * Query: accountId (uuid)
 * Response: { data: Beneficiary[] }
 */

import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { PaymentInitiationService } from '@/lib/services/openbanking/PaymentInitiationService';
import { db, obApiTransactions } from '@/lib/db';
import { securityLogger } from '@/lib/utils/security-logger';

export const dynamic = 'force-dynamic';

function extractBearerToken(request: NextRequest): string | null {
  const header = request.headers.get('authorization');
  if (!header?.startsWith('Bearer ')) return null;
  return header.slice(7).trim();
}

export async function GET(request: NextRequest) {
  const startTime = Date.now();
  const requestId = crypto.randomUUID();

  const accessToken = extractBearerToken(request);
  if (!accessToken) {
    return NextResponse.json(
      { error: 'invalid_token', error_description: 'Bearer access token required' },
      { status: 401 }
    );
  }

  try {
    const result = await PaymentInitiationService.listBeneficiaries(accessToken);

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
    const status = message.includes('UNAUTHORIZED') ? 403 : 500;
    await logApiTransaction(requestId, status, responseTimeMs, message.split(':')[0]);
    securityLogger.error('[BON PIS Beneficiaries]', { requestId, message });

    return NextResponse.json(
      { error: 'beneficiaries_error', error_description: message },
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
      endpoint: '/bon/v1/banking/beneficiaries',
      httpMethod: 'GET',
      httpStatusCode: statusCode,
      responseTimeMs,
      errorCode: errorCode ?? null,
    });
  } catch {
    // Non-blocking
  }
}
