/**
 * @fileoverview API route PATCH /api/intelligence/rate-recommendations/[id]
 * Location: /app/api/intelligence/rate-recommendations/[id]/route.ts
 *
 * Admin OR front desk decides on a pending rate suggestion.
 * Request: { action: 'approve' } | { action: 'reject', note?: string }
 * Approve applies the recommended rate to matching rooms' base_rate and audits.
 */
import { NextRequest } from 'next/server';
import { z } from 'zod';
import { withApiAuth, errorResponse, successResponse } from '@/lib/utils/api-helpers';
import { rateRecommendationService } from '@/lib/services/intelligence/RateRecommendationService';
import { AppError } from '@/lib/utils/errors';

const decisionSchema = z.discriminatedUnion('action', [
  z.object({ action: z.literal('approve') }),
  z.object({ action: z.literal('reject'), note: z.string().max(500).optional() }),
]);

export async function PATCH(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  return withApiAuth(
    request,
    async (req, user) => {
      if (!user.tenantId) return errorResponse('Tenant ID is required', 400, 'MISSING_TENANT_ID');
      let body: unknown;
      try {
        body = await request.json();
      } catch {
        return errorResponse('Invalid JSON', 400, 'INVALID_JSON');
      }
      const parsed = decisionSchema.safeParse(body);
      if (!parsed.success) {
        return errorResponse('Invalid input', 400, 'VALIDATION_ERROR', parsed.error.flatten().fieldErrors);
      }
      try {
        const result =
          parsed.data.action === 'approve'
            ? await rateRecommendationService.approve({
                id,
                tenantId: user.tenantId,
                actorUserId: user.id ?? null,
                request: req,
              })
            : await rateRecommendationService.reject({
                id,
                tenantId: user.tenantId,
                actorUserId: user.id ?? null,
                note: parsed.data.note,
                request: req,
              });
        return successResponse(result);
      } catch (e) {
        if (e instanceof AppError) return errorResponse(e.message, e.statusCode, 'RATE_REC_DECISION');
        throw e;
      }
    },
    { requireRole: ['owner', 'manager', 'admin', 'desk'], rateLimit: true },
  );
}
