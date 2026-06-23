/**
 * @fileoverview API route PATCH /api/intelligence/reorder-recommendations/[id]
 * Location: /app/api/intelligence/reorder-recommendations/[id]/route.ts
 *
 * Admin OR front desk decides on a pending reorder suggestion.
 * Request: { action: 'approve' } | { action: 'reject', note?: string }
 * Approve authorises the purchase and audits it (stock is booked on delivery, not here).
 */
import { NextRequest } from 'next/server';
import { z } from 'zod';
import { withApiAuth, errorResponse, successResponse } from '@/lib/utils/api-helpers';
import { reorderRecommendationService } from '@/lib/services/intelligence/ReorderRecommendationService';
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
            ? await reorderRecommendationService.approve({
                id,
                tenantId: user.tenantId,
                actorUserId: user.id ?? null,
                request: req,
              })
            : await reorderRecommendationService.reject({
                id,
                tenantId: user.tenantId,
                actorUserId: user.id ?? null,
                note: parsed.data.note,
                request: req,
              });
        return successResponse(result);
      } catch (e) {
        if (e instanceof AppError) return errorResponse(e.message, e.statusCode, 'REORDER_REC_DECISION');
        throw e;
      }
    },
    { requireRole: ['owner', 'manager', 'admin', 'desk'], rateLimit: true },
  );
}
