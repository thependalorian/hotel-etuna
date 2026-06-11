/**
 * Fraud Alerts API Endpoint
 *
 * Purpose: Manage fraud alerts for the authenticated tenant.
 * Location: app/api/fraud/alerts/route.ts
 */

import { NextRequest, NextResponse } from 'next/server';
import { FraudDetectionService } from '@/lib/services/fraud/FraudDetectionService';
import { entityIdOptional } from '@/lib/validation/entity-ids';
import { withTenantApiAuth } from '@/lib/utils/api-helpers';
import { AppError } from '@/lib/utils/errors';
import { z } from 'zod';
import { securityLogger } from '@/lib/utils/security-logger';

const alertsQuerySchema = z.object({
  status: z.enum(['open', 'investigating', 'resolved', 'false_positive']).optional(),
  severity: z.enum(['info', 'warning', 'critical']).optional(),
  limit: z.coerce.number().int().positive().max(100).default(20),
});

const updateAlertSchema = z.object({
  alertId: z.string().uuid(),
  status: z.enum(['open', 'investigating', 'resolved', 'false_positive']).optional(),
  resolutionNotes: z.string().optional(),
  resolvedBy: entityIdOptional(),
  isFalsePositive: z.boolean().optional(),
});

export async function GET(request: NextRequest) {
  return withTenantApiAuth(request, async (req, user) => {
    try {
      const { searchParams } = new URL(req.url);
      const validationResult = alertsQuerySchema.safeParse({
        status: searchParams.get('status') || undefined,
        severity: searchParams.get('severity') || undefined,
        limit: searchParams.get('limit') || '20',
      });

      if (!validationResult.success) {
        return NextResponse.json(
          { success: false, error: 'Invalid query parameters', details: validationResult.error.issues },
          { status: 400 }
        );
      }

      const fraudService = new FraudDetectionService(user.tenantId);
      const alerts = await fraudService.getAlerts(validationResult.data);

      return NextResponse.json({ success: true, data: alerts, count: alerts.length });
    } catch (error) {
      if (error instanceof AppError) {
        return NextResponse.json({ success: false, error: error.message }, { status: error.statusCode });
      }
      securityLogger.error('[Fraud Alerts API] Error fetching alerts', { error: error instanceof Error ? error.message : String(error) });
      return NextResponse.json({ success: false, error: 'Failed to fetch alerts' }, { status: 500 });
    }
  });
}

export async function PATCH(request: NextRequest) {
  return withTenantApiAuth(request, async (req, user) => {
    try {
      const body = await req.json();
      const validationResult = updateAlertSchema.safeParse(body);

      if (!validationResult.success) {
        return NextResponse.json(
          { success: false, error: 'Invalid request data', details: validationResult.error.issues },
          { status: 400 }
        );
      }

      const { alertId, ...updateData } = validationResult.data;
      const fraudService = new FraudDetectionService(user.tenantId);
      const updatedAlert = await fraudService.updateAlert(alertId, updateData);

      securityLogger.info('[Fraud Alerts API] Alert updated', { alertId, status: updateData.status, tenantId: user.tenantId });

      return NextResponse.json({ success: true, data: updatedAlert });
    } catch (error) {
      if (error instanceof AppError) {
        return NextResponse.json({ success: false, error: error.message }, { status: error.statusCode });
      }
      securityLogger.error('[Fraud Alerts API] Error updating alert', { error: error instanceof Error ? error.message : String(error) });
      return NextResponse.json({ success: false, error: 'Failed to update alert' }, { status: 500 });
    }
  });
}
