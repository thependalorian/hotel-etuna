/**
 * @fileoverview Cron — generate approval-gated rate + reorder recommendations for the hub tenant.
 * Location: /app/api/cron/recommendations/route.ts
 *
 * GET /api/cron/recommendations  (Authorization: Bearer ${CRON_SECRET})
 * Refreshes the pending suggestion queues nightly. It NEVER applies a rate or places an order —
 * an admin/front-desk user still has to approve each suggestion in the dashboard.
 */
import { NextRequest, NextResponse } from 'next/server';
import { verifyCronRequest, cronUnauthorizedResponse } from '@/lib/utils/cron-auth';
import { resolvePublicHubProperty } from '@/lib/utils/public-property';
import { rateRecommendationService } from '@/lib/services/intelligence/RateRecommendationService';
import { reorderRecommendationService } from '@/lib/services/intelligence/ReorderRecommendationService';
import { securityLogger } from '@/lib/utils/security-logger';

export async function GET(request: NextRequest) {
  if (!verifyCronRequest(request)) {
    return cronUnauthorizedResponse();
  }

  try {
    const { hubTenant, property } = await resolvePublicHubProperty();
    const horizonDays = Number(new URL(request.url).searchParams.get('horizonDays') ?? '30') || 30;

    const rates = await rateRecommendationService.generate({
      tenantId: hubTenant.id,
      propertyId: property.id,
      horizonDays,
    });
    const reorders = await reorderRecommendationService.generate(hubTenant.id);

    return NextResponse.json({
      ok: true,
      generated: { rateRecommendations: rates.length, reorderRecommendations: reorders.length },
    });
  } catch (error) {
    securityLogger.error('[cron/recommendations] failed:', error);
    return NextResponse.json({ ok: false, error: 'Recommendation generation failed' }, { status: 500 });
  }
}
