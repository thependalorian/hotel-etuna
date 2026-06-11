/**
 * STR Creation API Endpoint
 * 
 * Purpose: Create Suspicious Transaction Reports
 * Endpoint: POST /api/compliance/aml/str/create
 * 
 * Features:
 * - Create new STR from alerts
 * - Automatic deadline calculation
 * - Supporting evidence compilation
 * 
 * Compliance: FIA Section 33 - STR submissions
 */

import { NextRequest, NextResponse } from 'next/server';
import { withTenantApiAuth } from '@/lib/utils/api-helpers';
import { STRGenerationService } from '@/lib/services/compliance/STRGenerationService';
import { entityId, entityIdArray } from '@/lib/validation/entity-ids';
import { z } from 'zod';
import { securityLogger } from '@/lib/utils/security-logger';

const createSTRSchema = z.object({
  tenantId: entityId(),
  guestId: entityId(),
  alertIds: entityIdArray(1),
  transactionIds: entityIdArray(1),
  suspicionCategory: z.enum([
    'structuring',
    'velocity',
    'pep_concern',
    'terrorist_financing',
    'high_value',
    'geographic_anomaly',
  ]),
  suspicionDescription: z.string().min(50),
  suspicionIndicators: z.array(z.string()).min(1),
  draftedBy: entityId(),
});

export async function POST(request: NextRequest) {
  return withTenantApiAuth(request, async (req, user) => {
    try {
      const body = await req.json();
      
      const validatedData = createSTRSchema.parse(body);

      const str = await STRGenerationService.createSTR(validatedData);

      return NextResponse.json({
        success: true,
        data: {
          str: {
            id: str.id,
            strReference: str.strReference,
            status: str.status,
            reportDeadline: str.reportDeadline,
            riskLevel: str.riskLevel,
          },
          message: 'STR created successfully',
        },
      }, { status: 201 });
    } catch (error) {
      securityLogger.error('[STR Create API] Error:', error);
      
      if (error instanceof z.ZodError) {
        return NextResponse.json({
          success: false,
          error: 'Validation error',
          details: error.issues,
        }, { status: 400 });
      }

      return NextResponse.json({
        success: false,
        error: 'Internal server error',
      }, { status: 500 });
    }
  });
}

export async function GET(request: NextRequest) {
  return withTenantApiAuth(request, async (req, user) => {
    try {
      const tenantId = user.tenantId;
      const status = req.nextUrl.searchParams.get('status') || undefined;

      const strs = await STRGenerationService.getSTRs(tenantId, status);

      return NextResponse.json({
        success: true,
        data: {
          strs,
          count: strs.length,
        },
      }, { status: 200 });
    } catch (error) {
      securityLogger.error('[STR Create API] Error fetching STRs:', error);
      
      return NextResponse.json({
        success: false,
        error: 'Internal server error',
      }, { status: 500 });
    }
  });
}
