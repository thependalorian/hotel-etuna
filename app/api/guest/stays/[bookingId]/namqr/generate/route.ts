/**
 * POST /api/guest/stays/[bookingId]/namqr/generate — guest folio NamQR (Option B)
 *
 * Body: { amount?: number } — defaults to full folio balance
 * Response: { data: { qrReference, qrPayload, qrImageUrl, expiresAt?, settlement } }
 */

import { NextRequest } from 'next/server';
import { z } from 'zod';
import { withApiAuth, errorResponse, successResponse } from '@/lib/utils/api-helpers';
import { HospitalityNamQrPaymentService } from '@/lib/services/payment/HospitalityNamQrPaymentService';
import { assertStayAccess, assertCheckedIn } from '@/lib/services/folio/guestStayAccess';
import { FolioService } from '@/lib/services/folio/FolioService';
import { GUEST_API_ROLES } from '@/lib/auth/roles';
import { entityId } from '@/lib/validation/entity-ids';
import { AppError } from '@/lib/utils/errors';

const bodySchema = z.object({
  amount: z.number().positive().optional(),
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

      const folio = await new FolioService().getFolio(bookingId);
      const amount = parsed.data.amount ?? folio.balanceDue;
      if (amount <= 0) {
        return errorResponse('No balance due on folio', 400, 'NO_BALANCE');
      }

      try {
        const result = await HospitalityNamQrPaymentService.generateGuestFolioQr({
          tenantId: user.tenantId,
          bookingId,
          guestId: ctx.guest.id,
          propertyId: ctx.booking.propertyId ?? undefined,
          amount,
        });

        return successResponse({
          qrReference: result.qrReference,
          qrPayload: result.qrPayload,
          qrImageUrl: result.qrImageUrl,
          expiresAt: result.expiresAt?.toISOString(),
          amount,
          settlement: result.settlement,
        });
      } catch (e) {
        if (e instanceof AppError) {
          return errorResponse(e.message, e.statusCode, 'NAMQR_GENERATE_FAILED');
        }
        console.error('[guest/namqr/generate]', e);
        return errorResponse('Failed to generate NamQR', 500, 'NAMQR_GENERATE_FAILED');
      }
    },
    { rateLimit: true, requireRole: [...GUEST_API_ROLES] }
  );
}
