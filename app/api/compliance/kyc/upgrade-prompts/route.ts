/**
 * @fileoverview API route //api/compliance/kyc/upgrade-prompts
 * Location: /app/api/compliance/kyc/upgrade-prompts/route.ts
 */

/**
 * KYC Upgrade Prompts API Endpoint
 * 
 * Purpose: Get and manage KYC upgrade prompts for guests
 * Functionality: Fetch pending prompts, mark as shown, dismiss, or accept
 * Location: /app/api/compliance/kyc/upgrade-prompts/route.ts
 * 
 * @version 1.0.0
 * @since April 21, 2026
 */

import { NextRequest, NextResponse } from 'next/server';
import { transactionValidator } from '@/lib/services/compliance/TransactionValidator';
// Note: withRateLimit not available - rate limiting handled by middleware
import { entityId } from '@/lib/validation/entity-ids';
import { recordAuditTrail } from '@/lib/compliance/record-audit';
import { db, kycUpgradePrompts } from '@/lib/db';
import {
  withPlatformApiAuth,
  errorResponse,
  successResponse,
} from '@/lib/utils/api-helpers';
import { eq } from 'drizzle-orm';
import { z } from 'zod';
import { securityLogger } from '@/lib/utils/security-logger';

// ============================================================================
// REQUEST VALIDATION SCHEMAS
// ============================================================================

const getPromptsSchema = z.object({
  guestId: entityId('Guest ID is required'),
  tenantId: entityId('Tenant ID is required'),
});

const updatePromptSchema = z.object({
  promptId: entityId('Prompt ID is required'),
  action: z.enum(['show', 'dismiss', 'accept']),
});

type UpgradePromptResponse = {
  id: string;
  currentKycTier: string;
  suggestedKycTier: string;
  triggerReason: string;
  createdAt: Date | string | null;
  isShown: boolean | null;
  isDismissed: boolean | null;
  isAccepted: boolean | null;
};

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : 'An unexpected error occurred';
}

// ============================================================================
// GET /api/compliance/kyc/upgrade-prompts
// ============================================================================

export async function GET(request: NextRequest) {
  try {
    // Step 1: Extract query parameters (rate limiting handled by middleware)
    const { searchParams } = new URL(request.url);
    const guestId = searchParams.get('guestId');
    const tenantId = searchParams.get('tenantId');

    // Step 2: Validate query parameters
    const validationResult = getPromptsSchema.safeParse({ guestId, tenantId });

    if (!validationResult.success) {
      return NextResponse.json(
        {
          error: 'Invalid query parameters',
          details: validationResult.error.issues.map((issue) => ({
            path: issue.path.join('.'),
            message: issue.message,
          })),
        },
        { status: 400 }
      );
    }

    const { guestId: validGuestId, tenantId: validTenantId } = validationResult.data;

    // Step 3: Fetch pending upgrade prompts
    const prompts = (await transactionValidator.getPendingUpgradePrompts(
      validGuestId,
      validTenantId
    )) as UpgradePromptResponse[];

    // Step 4: Return prompts
    return NextResponse.json({
      success: true,
      data: {
        prompts: prompts.map((prompt) => ({
          id: prompt.id,
          currentKycTier: prompt.currentKycTier,
          suggestedKycTier: prompt.suggestedKycTier,
          triggerReason: prompt.triggerReason,
          createdAt: prompt.createdAt,
          isShown: prompt.isShown,
          isDismissed: prompt.isDismissed,
          isAccepted: prompt.isAccepted,
        })),
        count: prompts.length,
      },
    });
  } catch (error: unknown) {
    securityLogger.error('Error fetching upgrade prompts:', error);

    return NextResponse.json(
      {
        error: 'Internal server error',
        message: getErrorMessage(error),
      },
      { status: 500 }
    );
  }
}

// ============================================================================
// POST /api/compliance/kyc/upgrade-prompts
// ============================================================================

export async function POST(request: NextRequest) {
  return withPlatformApiAuth(
    request,
    async (req, user) => {
      try {
        const body = await req.json();
        const validationResult = updatePromptSchema.safeParse(body);

        if (!validationResult.success) {
          return errorResponse('Invalid request data', 400, 'VALIDATION_ERROR', {
            details: validationResult.error.issues.map((issue) => ({
              path: issue.path.join('.'),
              message: issue.message,
            })),
          });
        }

        const { promptId, action } = validationResult.data;

        if (!user.tenantId) {
          return errorResponse('Unauthorized', 401, 'UNAUTHORIZED');
        }

        const [prompt] = await db
          .select()
          .from(kycUpgradePrompts)
          .where(eq(kycUpgradePrompts.id, promptId))
          .limit(1);

        if (!prompt || prompt.tenantId !== user.tenantId) {
          return errorResponse('Prompt not found', 404, 'NOT_FOUND');
        }

        switch (action) {
          case 'show':
            await transactionValidator.markPromptAsShown(promptId);
            break;
          case 'dismiss':
            await transactionValidator.dismissPrompt(promptId);
            break;
          case 'accept':
            await transactionValidator.acceptPrompt(promptId);
            break;
        }

        await recordAuditTrail({
          tenantId: user.tenantId,
          userId: user.id,
          action: `kyc.upgrade_prompt.${action}`,
          resourceType: 'kyc_upgrade_prompt',
          resourceId: promptId,
          oldValues: {
            isShown: prompt.isShown,
            isDismissed: prompt.isDismissed,
            isAccepted: prompt.isAccepted,
          },
          newValues: {
            action,
            guestId: prompt.guestId,
            suggestedKycTier: prompt.suggestedKycTier,
          },
          request: req,
        });

        return successResponse({ message: `Prompt ${action}ed successfully` });
      } catch (error: unknown) {
        securityLogger.error('Error updating upgrade prompt:', error);
        return errorResponse(getErrorMessage(error), 500, 'INTERNAL_ERROR');
      }
    },
    { rateLimit: true }
  );
}

// ============================================================================
// OPTIONS - CORS Support
// ============================================================================

export async function OPTIONS() {
  const allowedOrigin = process.env.NODE_ENV === 'production'
    ? (process.env.NEXT_PUBLIC_SITE_URL || 'https://hoteletuna.com')
    : 'http://localhost:3000';

  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': allowedOrigin,
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Allow-Credentials': 'true',
    },
  });
}
