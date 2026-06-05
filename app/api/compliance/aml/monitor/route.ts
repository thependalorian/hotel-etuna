/**
 * AML Transaction Monitoring API Endpoint
 * 
 * Purpose: Real-time transaction monitoring for AML/CFT compliance
 * Endpoint: POST /api/compliance/aml/monitor
 * 
 * Features:
 * - Monitor individual transactions for suspicious patterns
 * - Return risk assessment and alerts
 * - Automatic alert generation
 * 
 * Compliance: Namibian Financial Intelligence Act (FIA)
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireTenantSessionUser } from '@/lib/utils/api-helpers';
import { AppError } from '@/lib/utils/errors';
import { AMLMonitoringService } from '@/lib/services/compliance/AMLMonitoringService';
import { entityId } from '@/lib/validation/entity-ids';
import { z } from 'zod';
import { securityLogger } from '@/lib/utils/security-logger.client';

const monitorRequestSchema = z.object({
  transactionId: entityId(),
  tenantId: entityId(),
  guestId: entityId(),
  amount: z.number().positive(),
  currency: z.string().length(3).default('NAD'),
  transactionReference: z.string(),
  ipAddress: z.string().optional(),
  location: z.object({
    countryCode: z.string().length(2).optional(),
    city: z.string().optional(),
    latitude: z.number().optional(),
    longitude: z.number().optional(),
  }).optional(),
  timestamp: z.string().datetime().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const user = await requireTenantSessionUser(request);

    const body = await request.json();
    
    // Validate request
    const validatedData = monitorRequestSchema.parse(body);

    // Monitor transaction
    const result = await AMLMonitoringService.monitorTransaction({
      ...validatedData,
      timestamp: validatedData.timestamp ? new Date(validatedData.timestamp) : new Date(),
    });

    return NextResponse.json({
      success: true,
      data: {
        riskScore: result.riskScore,
        shouldBlock: result.shouldBlock,
        alerts: result.alerts,
        velocityCheck: result.velocityCheck,
        pepCheck: result.pepCheck,
      },
    }, { status: 200 });
  } catch (error) {
    securityLogger.error('[AML Monitor API] Error:', error);
    
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
    const user = await requireTenantSessionUser(request);

    const { searchParams } = new URL(request.url);
    const tenantId = user.tenantId;

    // Get pending alerts
    const alerts = await AMLMonitoringService.getPendingAlerts(tenantId);

    return NextResponse.json({
      success: true,
      data: {
        alerts,
        count: alerts.length,
      },
    }, { status: 200 });
  } catch (error) {
    securityLogger.error('[AML Monitor API] Error fetching alerts:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
    }, { status: 500 });
  }
}
