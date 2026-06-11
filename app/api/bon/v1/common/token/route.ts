/**
 * OAuth 2.0 Token Endpoint
 * 
 * Purpose: Exchange authorization code for access/refresh tokens
 * Location: /app/api/bon/v1/common/token/route.ts
 * 
 * Endpoint: POST /bon/v1/common/token
 * 
 * Implements:
 * - Namibian Open Banking Standards v1.0 (Section 9.5.1)
 * - RFC 6749: OAuth 2.0 Token Endpoint
 * - RFC 7636: PKCE verification
 * 
 * Grant Types:
 * - authorization_code: Exchange auth code for tokens
 * - refresh_token: Refresh expired access token
 * 
 * @version 1.0.0
 * @since January 28, 2026
 */

import { NextRequest, NextResponse } from 'next/server';
import { OAuthService, TokenRequest } from '@/lib/services/openbanking/OAuthService';
import { db, obApiTransactions } from '@/lib/db';
import crypto from 'crypto';
import { securityLogger } from '@/lib/utils/security-logger';

export async function POST(request: NextRequest) {
  const startTime = Date.now();
  const requestId = crypto.randomUUID();

  try {
    // Parse request body
    const body: TokenRequest = await request.json();

    // Validate grant type
    if (!['authorization_code', 'refresh_token'].includes(body.grant_type)) {
      return NextResponse.json(
        {
          error: 'unsupported_grant_type',
          error_description: 'Only authorization_code and refresh_token grant types are supported',
        },
        { status: 400 }
      );
    }

    // Exchange token through OAuth service
    const tokenResponse = await OAuthService.exchangeToken(body);

    // Log successful API transaction
    const responseTimeMs = Date.now() - startTime;
    await logApiTransaction(requestId, body.client_id, 200, responseTimeMs);

    return NextResponse.json(tokenResponse, {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-store',
        'Pragma': 'no-cache',
        'ParticipantId': 'API000001',
        'x-v': '1',
      },
    });
  } catch (error: any) {
    const responseTimeMs = Date.now() - startTime;
    const errorCode = error.message.split(':')[0];

    await logApiTransaction(requestId, 'unknown', 400, responseTimeMs, errorCode);

    // Map errors to OAuth error codes
    if (error.message.includes('INVALID_GRANT') || error.message.includes('EXPIRED')) {
      return NextResponse.json(
        {
          error: 'invalid_grant',
          error_description: error.message,
        },
        { status: 400 }
      );
    } else {
      return NextResponse.json(
        {
          error: 'invalid_request',
          error_description: error.message,
        },
        { status: 400 }
      );
    }
  }
}

async function logApiTransaction(
  requestId: string,
  tppParticipantId: string,
  httpStatusCode: number,
  responseTimeMs: number,
  errorCode?: string
) {
  try {
    await db.insert(obApiTransactions).values({
      requestId,
      tppParticipantId,
      endpoint: '/bon/v1/common/token',
      httpMethod: 'POST',
      httpStatusCode,
      responseTimeMs,
      errorCode,
    });
  } catch (logError) {
    securityLogger.error('Failed to log API transaction:', logError);
  }
}
