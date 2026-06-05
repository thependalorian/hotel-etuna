/**
 * STR Submission API Endpoint
 * 
 * Purpose: Submit STRs to Financial Intelligence Centre
 * Endpoint: POST /api/compliance/aml/str/submit
 * 
 * Features:
 * - Submit STR to FIC
 * - Update submission status
 * - Track FIC acknowledgment
 * 
 * Compliance: FIA Section 33 - STR submissions to FIC
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireTenantSessionUser } from '@/lib/utils/api-helpers';
import { AppError } from '@/lib/utils/errors';
import { STRGenerationService } from '@/lib/services/compliance/STRGenerationService';
import { entityId } from '@/lib/validation/entity-ids';
import { z } from 'zod';
import { securityLogger } from '@/lib/utils/security-logger.client';

const submitSTRSchema = z.object({
  strId: entityId(),
  submittedBy: entityId(),
  ficSubmissionReference: z.string(),
});

export async function POST(request: NextRequest) {
  try {
    const user = await requireTenantSessionUser(request);

    const body = await request.json();
    
    const validatedData = submitSTRSchema.parse(body);

    await STRGenerationService.submitSTR(validatedData);

    return NextResponse.json({
      success: true,
      message: 'STR submitted to FIC successfully',
    }, { status: 200 });
  } catch (error) {
    securityLogger.error('[STR Submit API] Error:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json({
        success: false,
        error: 'Validation error',
        details: error.issues,
      }, { status: 400 });
    }

    if (error instanceof Error && error.message.includes('not found')) {
      return NextResponse.json({
        success: false,
        error: error.message,
      }, { status: 404 });
    }

    if (error instanceof Error && error.message.includes('draft')) {
      return NextResponse.json({
        success: false,
        error: error.message,
      }, { status: 400 });
    }

    return NextResponse.json({
      success: false,
      error: 'Internal server error',
    }, { status: 500 });
  }
}
