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
import { PEPScreeningService } from '@/lib/services/compliance/PEPScreeningService';
import { entityId } from '@/lib/validation/entity-ids';
import { z } from 'zod';

const screenRequestSchema = z.object({
  guestId: entityId(),
  tenantId: entityId(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    const validatedData = screenRequestSchema.parse(body);

    const result = await PEPScreeningService.screenGuest(
      validatedData.guestId,
      validatedData.tenantId
    );

    return NextResponse.json({
      success: true,
      data: result,
    }, { status: 200 });
  } catch (error) {
    console.error('[PEP Screen API] Error:', error);
    
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
  try {
    const { searchParams } = new URL(request.url);
    const tenantId = searchParams.get('tenantId');

    if (!tenantId) {
      return NextResponse.json({
        success: false,
        error: 'Tenant ID is required',
      }, { status: 400 });
    }

    const pepFlags = await PEPScreeningService.getActivePEPFlags(tenantId);

    return NextResponse.json({
      success: true,
      data: {
        pepFlags,
        count: pepFlags.length,
      },
    }, { status: 200 });
  } catch (error) {
    console.error('[PEP Screen API] Error fetching PEP flags:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
    }, { status: 500 });
  }
}
