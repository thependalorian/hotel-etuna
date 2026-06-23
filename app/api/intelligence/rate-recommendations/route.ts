/**
 * @fileoverview API route /api/intelligence/rate-recommendations
 * Location: /app/api/intelligence/rate-recommendations/route.ts
 *
 * GET  → list rate recommendations (default status=pending).
 * POST → generate fresh suggestions from the latest occupancy forecast (does NOT apply rates).
 * Suggestions only — applying a rate requires approval via PATCH [id].
 */
import { NextRequest } from 'next/server';
import { z } from 'zod';
import { withApiAuth, errorResponse, successResponse } from '@/lib/utils/api-helpers';
import { rateRecommendationService } from '@/lib/services/intelligence/RateRecommendationService';
import { AppError } from '@/lib/utils/errors';

const generateSchema = z.object({
  propertyId: z.string().uuid().optional(),
  horizonDays: z.number().int().min(1).max(365).optional(),
});

export async function GET(request: NextRequest) {
  return withApiAuth(
    request,
    async (_req, user) => {
      if (!user.tenantId) return errorResponse('Tenant ID is required', 400, 'MISSING_TENANT_ID');
      const status = new URL(request.url).searchParams.get('status') ?? 'pending';
      const rows = await rateRecommendationService.listByStatus(user.tenantId, status);
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
      let body: unknown = {};
      try {
        body = await request.json();
      } catch {
        body = {};
      }
      const parsed = generateSchema.safeParse(body);
      if (!parsed.success) {
        return errorResponse('Invalid input', 400, 'VALIDATION_ERROR', parsed.error.flatten().fieldErrors);
      }
      try {
        const created = await rateRecommendationService.generate({
          tenantId: user.tenantId,
          propertyId: parsed.data.propertyId ?? null,
          horizonDays: parsed.data.horizonDays,
        });
        return successResponse({ generated: created.length, recommendations: created });
      } catch (e) {
        if (e instanceof AppError) return errorResponse(e.message, e.statusCode, 'RATE_REC_GENERATE');
        throw e;
      }
    },
    { requireRole: ['owner', 'manager', 'admin'], rateLimit: true },
  );
}
