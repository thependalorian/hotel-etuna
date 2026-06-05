/**
 * POST /api/guest/stays/[bookingId]/namqr/notify — guest "I've paid" (Option B)
 *
 * Body: { amountClaimed: number, bankReference: string, qrReference?: string }
 * Response: { data: { id, status, message } }
 */

import { NextRequest } from 'next/server';
import { z } from 'zod';
import { withApiAuth, errorResponse, successResponse } from '@/lib/utils/api-helpers';
import { HospitalityNamQrPaymentService } from '@/lib/services/payment/HospitalityNamQrPaymentService';
import {
  assertStayAccess,
  assertCheckedIn,
} from '@/lib/services/folio/guestStayAccess';
import { GUEST_API_ROLES } from '@/lib/auth/roles';
import { entityId } from '@/lib/validation/entity-ids';
import { AppError } from '@/lib/utils/errors';
import { securityLogger } from '@/lib/utils/security-logger.client';

const bodySchema = z.object({
  amountClaimed: z.number().positive(),
  bankReference: z.string().min(4).max(64),
  qrReference: z.string().max(10).optional(),
});

type RouteParams = { params: Promise<{ bookingId: string }> };

export async function POST(request: NextRequest, { params }: RouteParams) {
  return withApiAuth(
    request,
    async (req, user) => {
      const { bookingId } = await params;
      const idCheck = entityId('Invalid booking ID').safeParse(bookingId);
      if (!idCheck.success) {
        return errorResponse('Invalid booking ID', 400, 'VALIDATION_ERROR');
      }

      const ctx = await assertStayAccess(bookingId, user);
      assertCheckedIn(ctx.booking);

      if (!user.tenantId) {
        return errorResponse('Tenant required', 400, 'MISSING_TENANT');
      }

      let body: unknown;
      try {
        body = await req.json();
      } catch {
        return errorResponse('Invalid JSON', 400, 'INVALID_JSON');
      }

      const parsed = bodySchema.safeParse(body);
      if (!parsed.success) {
        return errorResponse('Validation failed', 400, 'VALIDATION_ERROR', parsed.error.flatten());
      }

      try {
        const result = await HospitalityNamQrPaymentService.submitGuestPaymentNotification({
          tenantId: user.tenantId,
          bookingId,
          guestId: ctx.guest.id,
          submittedByUserId: user.id,
          amountClaimed: parsed.data.amountClaimed,
          bankReference: parsed.data.bankReference,
          qrReference: parsed.data.qrReference,
        });

        return successResponse(result, 201);
      } catch (e) {
        if (e instanceof AppError) {
          return errorResponse(e.message, e.statusCode, 'NAMQR_NOTIFY_FAILED');
        }
        securityLogger.error('[guest/namqr/notify]', e);
        return errorResponse('Failed to submit payment notification', 500, 'NAMQR_NOTIFY_FAILED');
      }
    },
    { rateLimit: true, requireRole: [...GUEST_API_ROLES] }
  );
}
