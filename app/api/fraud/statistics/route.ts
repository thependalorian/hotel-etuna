/**
 * Fraud Statistics API Endpoint
 *
 * Purpose: Provide fraud detection statistics and metrics for the authenticated tenant.
 * Location: app/api/fraud/statistics/route.ts
 */

import { NextRequest, NextResponse } from 'next/server';
import { FraudDetectionService } from '@/lib/services/fraud/FraudDetectionService';
import { withTenantApiAuth } from '@/lib/utils/api-helpers';
import { AppError } from '@/lib/utils/errors';
import { securityLogger } from '@/lib/utils/security-logger';
import { z } from 'zod';

const statisticsQuerySchema = z.object({
  periodType: z.enum(['daily', 'weekly', 'monthly']).default('daily'),
});

export async function GET(request: NextRequest) {
  return withTenantApiAuth(request, async (req, user) => {
    try {
      const { searchParams } = new URL(req.url);
      const validationResult = statisticsQuerySchema.safeParse({
        periodType: searchParams.get('periodType') || 'daily',
      });

      if (!validationResult.success) {
        return NextResponse.json(
          { success: false, error: 'Invalid query parameters', details: validationResult.error.issues },
          { status: 400 }
        );
      }

      const { periodType } = validationResult.data;
      const fraudService = new FraudDetectionService(user.tenantId);
      const statistics = await fraudService.getStatistics(periodType);

      return NextResponse.json({
        success: true,
        data: { ...statistics, periodType, generatedAt: new Date().toISOString() },
      });
    } catch (error) {
      if (error instanceof AppError) {
        return NextResponse.json({ success: false, error: error.message }, { status: error.statusCode });
      }
      securityLogger.error('[Fraud Statistics API] Error', { error: error instanceof Error ? error.message : String(error) });
      return NextResponse.json({ success: false, error: 'Failed to fetch statistics' }, { status: 500 });
    }
  });
}
