/**
 * Fraud Alerts API Endpoint
 * 
 * Purpose: Manage fraud alerts and notifications
 * Functionality: Get, update, and filter fraud alerts
 * Location: app/api/fraud/alerts/route.ts
 * 
 * @implements Rule 4: Vercel compatible
 * @implements Rule 10: Comprehensive error handling
 */

import { NextRequest, NextResponse } from 'next/server';
import { FraudDetectionService } from '@/lib/services/fraud/FraudDetectionService';
import { entityId, entityIdOptional } from '@/lib/validation/entity-ids';
import { z } from 'zod';

// Query parameters schema
const alertsQuerySchema = z.object({
  tenantId: entityId(),
  status: z.enum(['open', 'investigating', 'resolved', 'false_positive']).optional(),
  severity: z.enum(['info', 'warning', 'critical']).optional(),
  limit: z.coerce.number().int().positive().max(100).default(20),
});

// Update alert schema
const updateAlertSchema = z.object({
  tenantId: entityId(),
  alertId: entityId(),
  status: z.enum(['open', 'investigating', 'resolved', 'false_positive']).optional(),
  resolutionNotes: z.string().optional(),
  resolvedBy: entityIdOptional(),
  isFalsePositive: z.boolean().optional(),
});

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    // Build query object
    const queryData = {
      tenantId: searchParams.get('tenantId'),
      status: searchParams.get('status') || undefined,
      severity: searchParams.get('severity') || undefined,
      limit: searchParams.get('limit') || '20',
    };

    const validationResult = alertsQuerySchema.safeParse(queryData);

    if (!validationResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid query parameters',
          details: validationResult.error.issues,
        },
        { status: 400 }
      );
    }

    const { tenantId, status, severity, limit } = validationResult.data;

    // Initialize fraud detection service
    const fraudService = new FraudDetectionService(tenantId);

    // Get alerts
    const alerts = await fraudService.getAlerts({ status, severity, limit });

    return NextResponse.json({
      success: true,
      data: alerts,
      count: alerts.length,
    });
  } catch (error) {
    console.error('[Fraud Alerts API] Error fetching alerts:', error);

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch alerts',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const validationResult = updateAlertSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid request data',
          details: validationResult.error.issues,
        },
        { status: 400 }
      );
    }

    const { tenantId, alertId, ...updateData } = validationResult.data;

    // Initialize fraud detection service
    const fraudService = new FraudDetectionService(tenantId);

    // Update alert
    const updatedAlert = await fraudService.updateAlert(alertId, updateData);

    console.log('[Fraud Alerts API] Alert updated', {
      alertId,
      status: updateData.status,
    });

    return NextResponse.json({
      success: true,
      data: updatedAlert,
    });
  } catch (error) {
    console.error('[Fraud Alerts API] Error updating alert:', error);

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to update alert',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
