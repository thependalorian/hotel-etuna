/**
 * @fileoverview API route GET /api/intelligence/maintenance-insights
 * Location: /app/api/intelligence/maintenance-insights/route.ts
 *
 * Read-only predictive maintenance: rooms with repeat maintenance issues over a trailing window,
 * flagged for proactive inspection. Query: ?lookbackDays=90&minIssues=3&propertyId=<uuid>
 */
import { NextRequest } from 'next/server';
import { withApiAuth, errorResponse, successResponse } from '@/lib/utils/api-helpers';
import { maintenanceInsightsService } from '@/lib/services/intelligence/MaintenanceInsightsService';

export async function GET(request: NextRequest) {
  return withApiAuth(
    request,
    async (_req, user) => {
      if (!user.tenantId) return errorResponse('Tenant ID is required', 400, 'MISSING_TENANT_ID');
      const url = new URL(request.url);
      const lookbackDays = Number(url.searchParams.get('lookbackDays')) || undefined;
      const minIssues = Number(url.searchParams.get('minIssues')) || undefined;
      const propertyId = url.searchParams.get('propertyId') ?? undefined;
      const rows = await maintenanceInsightsService.getRepeatIssueRooms({
        tenantId: user.tenantId,
        propertyId,
        lookbackDays,
        minIssues,
      });
      return successResponse(rows);
    },
    { requireRole: ['owner', 'manager', 'admin', 'desk'] },
  );
}
