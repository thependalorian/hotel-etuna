/**
 * POST /api/payments/namqr/confirm — staff confirms guest paid via banking app (NamQR / EFT)
 * Location: app/api/payments/namqr/confirm/route.ts
 *
 * Body: { bookingId, amountPaid, bankReference, qrReference? }
 * Response: { data: { amountSettled, balanceRemaining, transactionReference, folioClosed } }
 */

import { NextRequest } from 'next/server';
import { z } from 'zod';
import { withApiAuth, errorResponse, successResponse } from '@/lib/utils/api-helpers';
import { HospitalityNamQrPaymentService } from '@/lib/services/payment/HospitalityNamQrPaymentService';
import { entityId } from '@/lib/validation/entity-ids';

const bodySchema = z.object({
  bookingId: entityId(),
  amountPaid: z.number().positive(),
  bankReference: z.string().min(4).max(64),
  qrReference: z.string().max(10).optional(),
});

export async function POST(request: NextRequest) {
  return withApiAuth(
    request,
    async (req, user) => {
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
        if (!user.tenantId) {
          return errorResponse('Tenant required', 400, 'MISSING_TENANT');
        }

        const result = await HospitalityNamQrPaymentService.confirmDeskPayment({
          bookingId: parsed.data.bookingId,
          tenantId: user.tenantId,
          amountPaid: parsed.data.amountPaid,
          bankReference: parsed.data.bankReference,
          qrReference: parsed.data.qrReference,
          userId: user.id,
        });

        return successResponse(result);
      } catch (e) {
        console.error('[namqr/confirm]', e);
        const message = e instanceof Error ? e.message : 'Confirm failed';
        return errorResponse(message, 400, 'NAMQR_CONFIRM_FAILED');
      }
    },
    { requireRole: ['owner', 'manager', 'admin', 'staff'] }
  );
}
