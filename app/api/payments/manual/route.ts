/**
 * POST /api/payments/manual — record EFT / e-wallet / NamQR bank-app payment
 * Location: app/api/payments/manual/route.ts
 *
 * Body: { bookingId, amount, rail, bankReference, payerName?, notes?, applyToFolio? }
 * Response: { data: { transactionId, transactionReference, paymentGateway } }
 */

import { NextRequest } from 'next/server';
import { z } from 'zod';
import { withApiAuth, errorResponse, successResponse } from '@/lib/utils/api-helpers';
import { manualPaymentService } from '@/lib/services/payment/ManualPaymentService';

const bodySchema = z.object({
  bookingId: z.string().uuid(),
  amount: z.number().positive(),
  rail: z.enum(['eft', 'ewallet', 'namqr', 'bank_deposit']),
  bankReference: z.string().min(3).max(100),
  payerName: z.string().max(100).optional(),
  notes: z.string().max(500).optional(),
  applyToFolio: z.boolean().optional(),
});

export async function POST(request: NextRequest) {
  return withApiAuth(
    request,
    async (req, user) => {
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
        const result = await manualPaymentService.recordPayment({
          bookingId: parsed.data.bookingId,
          tenantId: user.tenantId,
          staffUserId: user.id,
          amount: parsed.data.amount,
          rail: parsed.data.rail,
          bankReference: parsed.data.bankReference,
          payerName: parsed.data.payerName,
          notes: parsed.data.notes,
          applyToFolio: parsed.data.applyToFolio ?? true,
        });

        return successResponse(result, 201);
      } catch (e: unknown) {
        if (e && typeof e === 'object' && 'statusCode' in e) {
          const err = e as { statusCode: number; message: string };
          return errorResponse(err.message, err.statusCode, 'MANUAL_PAYMENT_FAILED');
        }
        const msg = e instanceof Error ? e.message : 'Failed to record payment';
        return errorResponse(msg, 500, 'MANUAL_PAYMENT_FAILED');
      }
    },
    { requireRole: ['owner', 'manager', 'admin', 'staff'] }
  );
}
