/**
 * @fileoverview API route //api/payments/namqr/pending/[id]/approve
 * Location: /app/api/payments/namqr/pending/[id]/approve/route.ts
 */

/**
 * POST /api/payments/namqr/pending/[id]/approve — staff approves guest NamQR claim
 *
 * Body: { amountPaid?: number }
 * Response: { data: settlement summary }
 */

import { NextRequest } from 'next/server';
import { z } from 'zod';
import { withApiAuth, errorResponse, successResponse } from '@/lib/utils/api-helpers';
import { HospitalityNamQrPaymentService } from '@/lib/services/payment/HospitalityNamQrPaymentService';
import { entityId } from '@/lib/validation/entity-ids';
import { AppError } from '@/lib/utils/errors';
import { securityLogger } from '@/lib/utils/security-logger';

const bodySchema = z.object({
  amountPaid: z.number().positive().optional(),
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
        const result = await HospitalityNamQrPaymentService.approvePending({
          pendingId: id,
          tenantId: user.tenantId,
          userId: user.id,
          amountPaid: parsed.data.amountPaid,
        });

        return successResponse(result);
      } catch (e) {
        if (e instanceof AppError) {
          return errorResponse(e.message, e.statusCode, 'NAMQR_APPROVE_FAILED');
        }
        securityLogger.error('[namqr/pending/approve]', e);
        return errorResponse('Approve failed', 500, 'NAMQR_APPROVE_FAILED');
      }
    },
    { requireRole: ['owner', 'manager', 'admin', 'staff'] }
  );
}
