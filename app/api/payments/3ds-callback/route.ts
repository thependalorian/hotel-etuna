/**
 * 3D Secure Callback Endpoint
 * 
 * Purpose: Handle POST callbacks from Bankserv after 3DS authentication
 * Location: app/api/payments/3ds-callback/route.ts
 * 
 * Flow:
 * 1. User completes 3DS authentication on bank's ACS page
 * 2. Bankserv POSTs response to this endpoint
 * 3. We authenticate the 3DS transaction with Adumo
 * 4. Redirect user back to booking confirmation page
 * 
 * Compliance: PSD-4 (3D Secure mandatory for CNP transactions)
 */

import { NextRequest, NextResponse } from 'next/server';
import { AdumoEnterpriseService } from '@/lib/services/payment/AdumoEnterpriseService';
import { HTTP_STATUS } from '@/lib/config/constants';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    // Parse form data from Bankserv
    const formData = await request.formData();
    const md = formData.get('MD') as string;
    const paRes = formData.get('PaRes') as string;

    console.log('[3DS Callback] Received response from Bankserv', {
      md: md?.substring(0, 20) + '...',
      paRes: paRes?.substring(0, 20) + '...',
    });

    // Extract transaction ID from MD field
    // MD contains the transaction ID that was sent to Bankserv
    const transactionId = md;

    if (!transactionId || !paRes) {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing required 3DS authentication data',
        },
        { status: HTTP_STATUS.BAD_REQUEST }
      );
    }

    // Authenticate with Adumo to verify 3DS completion
    try {
      const authResult = await AdumoEnterpriseService.authenticate3DS(transactionId);

      console.log('[3DS Callback] Authentication result', {
        transactionId: authResult.transactionId,
        statusCode: authResult.statusCode,
        authorizationAllow: authResult.authorizationAllow,
        eciFlag: authResult.eciFlag,
      });

      // Check if authentication was successful
      if (authResult.authorizationAllow === 'Y' && authResult.paresStatus === 'Y') {
        // Success - redirect to payment completion page
        return NextResponse.redirect(
          new URL(
            `/api/payments/complete?transactionId=${transactionId}&status=authenticated`,
            request.url
          )
        );
      } else {
        // Failed authentication - redirect to failure page
        return NextResponse.redirect(
          new URL(
            `/api/payments/complete?transactionId=${transactionId}&status=failed&reason=3ds_failed`,
            request.url
          )
        );
      }
    } catch (error) {
      console.error('[3DS Callback] Authentication API error:', error);
      
      // Redirect to error page
      return NextResponse.redirect(
        new URL(
          `/api/payments/complete?transactionId=${transactionId}&status=error&reason=auth_api_failed`,
          request.url
        )
      );
    }
  } catch (error) {
    console.error('[3DS Callback] Error processing callback:', error);

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to process 3DS callback',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: HTTP_STATUS.INTERNAL_SERVER_ERROR }
    );
  }
}

// Handle GET requests (shouldn't happen, but provide helpful message)
export async function GET(request: NextRequest) {
  return NextResponse.json(
    {
      success: false,
      error: 'This endpoint only accepts POST requests from Bankserv 3DS',
    },
    { status: HTTP_STATUS.BAD_REQUEST } // Method not allowed equivalent
  );
}
