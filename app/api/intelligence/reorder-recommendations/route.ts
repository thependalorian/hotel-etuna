/**
 * @fileoverview API route /api/intelligence/reorder-recommendations
 * Location: /app/api/intelligence/reorder-recommendations/route.ts
 *
 * GET  → list reorder recommendations (default status=pending).
 * POST → generate fresh suggestions for low-stock items (does NOT place orders).
 * Suggestions only — authorising a purchase requires approval via PATCH [id].
 */
import { NextRequest } from 'next/server';
import { withApiAuth, errorResponse, successResponse } from '@/lib/utils/api-helpers';
import { reorderRecommendationService } from '@/lib/services/intelligence/ReorderRecommendationService';
import { AppError } from '@/lib/utils/errors';

export async function GET(request: NextRequest) {
  return withApiAuth(
    request,
    async (_req, user) => {
      if (!user.tenantId) return errorResponse('Tenant ID is required', 400, 'MISSING_TENANT_ID');
      const status = new URL(request.url).searchParams.get('status') ?? 'pending';
      const rows = await reorderRecommendationService.listByStatus(user.tenantId, status);
      return successResponse(rows);
    },
    { requireRole: ['owner', 'manager', 'admin', 'desk'] },
  );
}

export async function POST(request: NextRequest) {
  return withApiAuth(
    request,
    async (_req, user) => {
      if (!user.tenantId) return errorResponse('Tenant ID is required', 400, 'MISSING_TENANT_ID');
      try {
        const created = await reorderRecommendationService.generate(user.tenantId);
        return successResponse({ generated: created.length, recommendations: created });
      } catch (e) {
        if (e instanceof AppError) return errorResponse(e.message, e.statusCode, 'REORDER_REC_GENERATE');
        throw e;
      }
    },
    { requireRole: ['owner', 'manager', 'admin'], rateLimit: true },
  );
}
