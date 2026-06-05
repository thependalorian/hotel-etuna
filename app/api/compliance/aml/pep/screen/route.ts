/**
 * PEP Screening API Endpoint
 * 
 * Purpose: Screen guests against PEP database
 * Endpoint: POST /api/compliance/aml/pep/screen
 * 
 * Features:
 * - Screen guest for PEP matches
 * - Initiate enhanced due diligence
 * - PEP flag management
 * 
 * Compliance: FIA Section 25 - Enhanced CDD for PEPs
 */

import { NextRequest, NextResponse } from 'next/server';
import { isPepScreeningEnabled } from '@/lib/config/compliance-flags';
import { requireTenantSessionUser } from '@/lib/utils/api-helpers';
import { PEPScreeningService } from '@/lib/services/compliance/PEPScreeningService';
import { entityId } from '@/lib/validation/entity-ids';
import { z } from 'zod';
import { securityLogger } from '@/lib/utils/security-logger.client';

const screenRequestSchema = z.object({
  guestId: entityId(),
  tenantId: entityId(),
});

export async function POST(request: NextRequest) {
  if (!isPepScreeningEnabled()) {
    return NextResponse.json(
      { success: false, error: 'PEP screening is not enabled for this deployment' },
      { status: 404 }
    );
  }
  try {
    const user = await requireTenantSessionUser(request);

    const body = await request.json();
    
    const validatedData = screenRequestSchema.parse(body);

    const result = await PEPScreeningService.screenGuest(
      validatedData.guestId,
      user.tenantId
    );

    return NextResponse.json({
      success: true,
      data: result,
    }, { status: 200 });
  } catch (error) {
    securityLogger.error('[PEP Screen API] Error:', error);
    
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
}

export async function GET(request: NextRequest) {
  if (!isPepScreeningEnabled()) {
    return NextResponse.json({
      success: true,
      data: { pepFlags: [], count: 0, disabled: true },
    });
  }
  try {
    const user = await requireTenantSessionUser(request);
    const tenantId = user.tenantId;

    const pepFlags = await PEPScreeningService.getActivePEPFlags(tenantId);

    return NextResponse.json({
      success: true,
      data: {
        pepFlags,
        count: pepFlags.length,
      },
    }, { status: 200 });
  } catch (error) {
    securityLogger.error('[PEP Screen API] Error fetching PEP flags:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
    }, { status: 500 });
  }
}
