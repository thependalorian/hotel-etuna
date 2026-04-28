/**
 * Fraud Statistics API Endpoint
 * 
 * Purpose: Provide fraud detection statistics and metrics
 * Functionality: Generate reports on fraud trends and detection effectiveness
 * Location: app/api/fraud/statistics/route.ts
 * 
 * @implements Rule 4: Vercel compatible
 * @implements Rule 10: Comprehensive error handling
 */

import { NextRequest, NextResponse } from 'next/server';
import { FraudDetectionService } from '@/lib/services/fraud/FraudDetectionService';
import { entityId } from '@/lib/validation/entity-ids';
import { z } from 'zod';

// Query parameters schema
const statisticsQuerySchema = z.object({
  tenantId: entityId(),
  periodType: z.enum(['daily', 'weekly', 'monthly']).default('daily'),
});

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    // Build query object
    const queryData = {
      tenantId: searchParams.get('tenantId'),
      periodType: searchParams.get('periodType') || 'daily',
    };

    const validationResult = statisticsQuerySchema.safeParse(queryData);

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

    const { tenantId, periodType } = validationResult.data;

    // Initialize fraud detection service
    const fraudService = new FraudDetectionService(tenantId);

    // Get statistics
    const statistics = await fraudService.getStatistics(periodType);

    return NextResponse.json({
      success: true,
      data: {
        ...statistics,
        periodType,
        generatedAt: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error('[Fraud Statistics API] Error fetching statistics:', error);

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch statistics',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
