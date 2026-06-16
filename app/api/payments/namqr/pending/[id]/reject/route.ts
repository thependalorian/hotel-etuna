/**
 * @fileoverview API route //api/payments/namqr/pending/[id]/reject
 * Location: /app/api/payments/namqr/pending/[id]/reject/route.ts
 */

/**
 * POST /api/payments/namqr/pending/[id]/reject — staff rejects guest NamQR claim
 *
 * Body: { reason?: string }
 */

import { NextRequest } from 'next/server';
import { z } from 'zod';
import { withApiAuth, errorResponse, successResponse } from '@/lib/utils/api-helpers';
import { HospitalityNamQrPaymentService } from '@/lib/services/payment/HospitalityNamQrPaymentService';
import { entityId } from '@/lib/validation/entity-ids';
import { AppError } from '@/lib/utils/errors';
import { securityLogger } from '@/lib/utils/security-logger';

const bodySchema = z.object({
  reason: z.string().max(500).optional(),
});

type RouteParams = { params: Promise<{ id: string }> };

export async function POST(request: NextRequest, { params }: RouteParams) {
  return withApiAuth(
    request,
    async (req, user) => {
      const { id } = await params;
      const idCheck = entityId('Invalid pending payment ID').safeParse(id);
      if (!idCheck.success) {
        return errorResponse('Invalid ID', 400, 'VALIDATION_ERROR');
      }

      if (!user.tenantId) {
        return errorResponse('Tenant required', 400, 'MISSING_TENANT');
      }

      let body: unknown = {};
      try {
        body = await req.json();
      } catch {
        body = {};
      }

      const parsed = bodySchema.safeParse(body);
      if (!parsed.success) {
        return errorResponse('Validation failed', 400, 'VALIDATION_ERROR', parsed.error.flatten());
      }

      try {
        const result = await HospitalityNamQrPaymentService.rejectPending({
          pendingId: id,
          tenantId: user.tenantId,
          userId: user.id,
          reason: parsed.data.reason,
        });

        return successResponse(result);
      } catch (e) {
        if (e instanceof AppError) {
          return errorResponse(e.message, e.statusCode, 'NAMQR_REJECT_FAILED');
        }
        securityLogger.error('[namqr/pending/reject]', e);
        return errorResponse('Reject failed', 500, 'NAMQR_REJECT_FAILED');
      }
    },
    { requireRole: ['owner', 'manager', 'admin', 'staff'] }
  );
}
