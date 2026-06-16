/**
 * @fileoverview API route //api/folio/charges/[id]/void
 * Location: /app/api/folio/charges/[id]/void/route.ts
 */

/**
 * Folio charge void API — immutable reversal pattern with reason code.
 *
 * POST /api/folio/charges/[id]/void
 * Body: { reasonCode: FolioVoidReasonCode, remark?: string }
 * Response: { data: { originalCharge, reversalCharge } }
 *
 * Auth: owner | manager | admin | staff
 */

import { NextRequest } from 'next/server';
import { z } from 'zod';
import {
  withApiAuth,
  errorResponse,
  successResponse,
} from '@/lib/utils/api-helpers';
import { FolioService } from '@/lib/services/folio/FolioService';
import { FOLIO_VOID_REASON_CODES } from '@/lib/folio/void-reason-codes';
import { AppError } from '@/lib/utils/errors';

const voidBodySchema = z.object({
  reasonCode: z.enum(FOLIO_VOID_REASON_CODES),
  remark: z.string().max(500).optional(),
});

type RouteContext = { params: Promise<{ id: string }> };

export async function POST(request: NextRequest, context: RouteContext) {
  return withApiAuth(
    request,
    async (req, user) => {
      if (!user.tenantId) {
        return errorResponse('Tenant required', 403, 'FORBIDDEN');
      }

      const { id: chargeId } = await context.params;

      let body: unknown;
      try {
        body = await req.json();
      } catch {
        return errorResponse('Invalid JSON body', 400, 'VALIDATION_ERROR');
      }

      const parsed = voidBodySchema.safeParse(body);
      if (!parsed.success) {
        return errorResponse('Invalid request body', 400, 'VALIDATION_ERROR', parsed.error.flatten());
      }

      try {
        const folioService = new FolioService();
        const result = await folioService.voidTransaction(chargeId, {
          userId: user.id,
          reasonCode: parsed.data.reasonCode,
          remark: parsed.data.remark,
        });

        return successResponse(result);
      } catch (error) {
        if (error instanceof AppError) {
          return errorResponse(error.message, error.statusCode, 'FOLIO_VOID_ERROR');
        }
        return errorResponse('Failed to void charge', 500, 'INTERNAL_ERROR');
      }
    },
    { rateLimit: true, requireRole: ['owner', 'manager', 'admin', 'staff'] }
  );
}
