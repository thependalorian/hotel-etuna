/**
 * KYC Verification API Endpoint
 * 
 * Purpose: Verify if a guest's transaction is allowed based on KYC tier
 * Functionality: Validates transaction amount against daily/monthly limits
 * Location: /app/api/compliance/kyc/verify/route.ts
 * 
 * @version 1.0.0
 * @since April 21, 2026
 */

import { NextRequest, NextResponse } from 'next/server';
import { withTenantApiAuth } from '@/lib/utils/api-helpers';
import { transactionValidator } from '@/lib/services/compliance/TransactionValidator';
// Note: withRateLimit not available - rate limiting handled by middleware
import { recordAuditTrail } from '@/lib/compliance/record-audit';
import { entityId, entityIdOptional } from '@/lib/validation/entity-ids';
import { z } from 'zod';
import { securityLogger } from '@/lib/utils/security-logger';

// ============================================================================
// REQUEST VALIDATION SCHEMA
// ============================================================================

const verifyTransactionSchema = z.object({
  guestId: entityId('Guest ID is required'),
  tenantId: entityId('Tenant ID is required'),
  amount: z.number().positive('Amount must be positive'),
  transactionId: entityIdOptional('Transaction ID is invalid'),
});

// ============================================================================
// POST /api/compliance/kyc/verify
// ============================================================================

export async function POST(request: NextRequest) {
  return withTenantApiAuth(request, async (req, user) => {
    try {
      // Step 1: Parse and validate request body (rate limiting handled by middleware)
      const body = await req.json();
      const validationResult = verifyTransactionSchema.safeParse(body);

      if (!validationResult.success) {
        return NextResponse.json(
          {
            error: 'Invalid request data',
            details: validationResult.error.issues.map((issue) => ({
              path: issue.path.join('.'),
              message: issue.message,
            })),
          },
          { status: 400 }
        );
      }

      const { guestId, amount, transactionId } = validationResult.data;
      const tenantId = user.tenantId;

      // Step 2: Validate transaction
      const validationResponse = await transactionValidator.validateTransaction(
        guestId,
        tenantId,
        amount,
        transactionId
      );

      // Step 3: Record audit trail
      await recordAuditTrail({
        tenantId,
        userId: guestId,
        action: 'kyc_verification',
        resourceType: 'transaction',
        resourceId: transactionId || undefined,
        newValues: {
          guestId,
          amount,
          isAllowed: validationResponse.isAllowed,
          kycTier: validationResponse.kycTier,
          reason: validationResponse.reason,
        },
      });

      // Step 4: Return validation result
      if (!validationResponse.isAllowed) {
        return NextResponse.json(
          {
            success: false,
            message: validationResponse.reason,
            data: {
              isAllowed: false,
              kycTier: validationResponse.kycTier,
              currentDailyTotal: validationResponse.currentDailyTotal,
              dailyLimit: validationResponse.dailyLimit,
              remainingDailyLimit: validationResponse.remainingDailyLimit,
              currentMonthlyBalance: validationResponse.currentMonthlyBalance,
              monthlyLimit: validationResponse.monthlyLimit,
              remainingMonthlyLimit: validationResponse.remainingMonthlyLimit,
              needsUpgrade: validationResponse.needsUpgrade,
              suggestedTier: validationResponse.suggestedTier,
            },
          },
          { status: 403 }
        );
      }

      return NextResponse.json({
        success: true,
        message: 'Transaction is allowed',
        data: {
          isAllowed: true,
          kycTier: validationResponse.kycTier,
          currentDailyTotal: validationResponse.currentDailyTotal,
          dailyLimit: validationResponse.dailyLimit,
          remainingDailyLimit: validationResponse.remainingDailyLimit,
          currentMonthlyBalance: validationResponse.currentMonthlyBalance,
          monthlyLimit: validationResponse.monthlyLimit,
          remainingMonthlyLimit: validationResponse.remainingMonthlyLimit,
        },
      });
    } catch (error: any) {
      securityLogger.error('Error in KYC verification endpoint:', error);

      return NextResponse.json(
        {
          error: 'Internal server error',
          message: error.message || 'An unexpected error occurred',
        },
        { status: 500 }
      );
    }
  });
}

// ============================================================================
// OPTIONS - CORS Support
// ============================================================================

export async function OPTIONS(request: NextRequest) {
  const allowedOrigin = process.env.NODE_ENV === 'production'
    ? (process.env.NEXT_PUBLIC_SITE_URL || 'https://hoteletuna.com')
    : 'http://localhost:3000';

  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': allowedOrigin,
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Allow-Credentials': 'true',
    },
  });
}
