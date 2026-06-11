/**
 * Pushed Authorization Request (PAR) API Route
 * 
 * Purpose: OAuth 2.0 PAR endpoint (RFC 9126)
 * Location: /app/api/bon/v1/common/par/route.ts
 * 
 * Endpoint: POST /bon/v1/common/par
 * 
 * Implements:
 * - Namibian Open Banking Standards v1.0 (Section 9.5.1)
 * - RFC 9126: OAuth 2.0 Pushed Authorization Requests
 * - RFC 7636: PKCE
 * 
 * Security:
 * - mTLS certificate authentication
 * - TPP participant validation
 * - PKCE code_challenge validation
 * 
 * Compliance:
 * - Request logs for BoN reporting
 * - Performance monitoring (< 300ms)
 * 
 * @version 1.0.0
 * @since January 28, 2026
 */

import { NextRequest, NextResponse } from 'next/server';
import { OAuthService, PushedAuthorizationRequest } from '@/lib/services/openbanking/OAuthService';
import { db, obApiTransactions } from '@/lib/db';
import crypto from 'crypto';
import { securityLogger } from '@/lib/utils/security-logger';

export async function POST(request: NextRequest) {
  const startTime = Date.now();
  const requestId = crypto.randomUUID();

  try {
    // Parse request body
    const body: PushedAuthorizationRequest = await request.json();

    // Validate required fields
    if (!body.client_id || !body.code_challenge || !body.redirect_uri || !body.scope) {
      const responseTimeMs = Date.now() - startTime;
      await logApiTransaction(requestId, body.client_id, 400, responseTimeMs, undefined, 'INVALID_REQUEST');

      return NextResponse.json(
        {
          error: 'invalid_request',
          error_description: 'Missing required parameters: client_id, code_challenge, redirect_uri, scope',
        },
        { status: 400 }
      );
    }

    // Process PAR through OAuth service
    const parResponse = await OAuthService.pushAuthorizationRequest(body);

    // Log successful API transaction
    const responseTimeMs = Date.now() - startTime;
    await logApiTransaction(requestId, body.client_id, 200, responseTimeMs, undefined, undefined);

    // Return response (RFC 9126 format)
    return NextResponse.json(parResponse, {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-store',
        'Pragma': 'no-cache',
        'ParticipantId': 'API000001', // Hotel Etuna as Data Provider
        'x-v': '1', // API version
      },
    });
  } catch (error: any) {
    const responseTimeMs = Date.now() - startTime;
    const errorCode = error.message.split(':')[0] || 'SERVER_ERROR';

    await logApiTransaction(requestId, 'unknown', 400, responseTimeMs, undefined, errorCode);

    // Determine error response based on error type
    if (error.message.includes('INVALID_CLIENT')) {
      return NextResponse.json(
        {
          error: 'invalid_client',
          error_description: error.message,
        },
        { status: 401 }
      );
    } else if (error.message.includes('INVALID_SCOPE')) {
      return NextResponse.json(
        {
          error: 'invalid_scope',
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

// ============================================================================
// LOGGING UTILITY
// ============================================================================

async function logApiTransaction(
  requestId: string,
  tppParticipantId: string,
  httpStatusCode: number,
  responseTimeMs: number,
  consentId: string | undefined,
  errorCode: string | undefined
) {
  try {
    await db.insert(obApiTransactions).values({
      requestId,
      tppParticipantId,
      endpoint: '/bon/v1/common/par',
      httpMethod: 'POST',
      httpStatusCode,
      responseTimeMs,
      consentId,
      errorCode,
      errorMessage: errorCode ? `Error during PAR: ${errorCode}` : undefined,
    });
  } catch (logError) {
    securityLogger.error('Failed to log API transaction:', logError);
    // Don't throw - logging failure shouldn't break API
  }
}
