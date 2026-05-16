/**
 * Adumo Virtual — confirm payment after redirect (validates _RESPONSE_TOKEN).
 * Location: app/api/payments/virtual/confirm/route.ts
 */

import { NextRequest } from 'next/server';
import { z } from 'zod';
import {
  withApiAuth,
  errorResponse,
  successResponse,
} from '@/lib/utils/api-helpers';
import { AdumoVirtualService } from '@/lib/services/payment/AdumoVirtualService';
import { completeAdumoVirtualPayment } from '@/lib/services/payment/completeAdumoVirtualPayment';
import { AppError } from '@/lib/utils/errors';

const confirmSchema = z.object({
  merchantReference: z.string().min(1),
  responseToken: z.string().min(1),
  transactionIndex: z.string().optional(),
  result: z.string().optional(),
});

export async function POST(request: NextRequest) {
  return withApiAuth(
    request,
    async (req) => {
      let body: unknown;
      try {
        body = await req.json();
      } catch {
        return errorResponse('Invalid JSON', 400, 'INVALID_JSON');
      }

      const parsed = confirmSchema.safeParse(body);
      if (!parsed.success) {
        return errorResponse('Invalid input', 400, 'VALIDATION_ERROR');
      }

      const { merchantReference, responseToken, transactionIndex, result } = parsed.data;

      if (result != null && !AdumoVirtualService.isRedirectSuccess(result)) {
        return errorResponse('Payment was not successful', 402, 'PAYMENT_FAILED');
      }

      const decoded = AdumoVirtualService.verifyResponseToken(responseToken);
      if (!decoded) {
        return errorResponse('Invalid payment response token', 400, 'INVALID_TOKEN');
      }

      if (decoded.mref !== merchantReference) {
        return errorResponse('Merchant reference mismatch', 400, 'REFERENCE_MISMATCH');
      }

      try {
        const outcome = await completeAdumoVirtualPayment({
          merchantReference,
          transactionIndex: transactionIndex ?? decoded.transactionIndex ?? merchantReference,
          decoded,
        });

        return successResponse({
          bookingId: outcome.bookingId,
          alreadyProcessed: outcome.alreadyProcessed,
          message: 'Payment confirmed',
        });
      } catch (error) {
        if (error instanceof AppError) {
          return errorResponse(error.message, error.statusCode, 'PAYMENT_CONFIRM_ERROR');
        }
        throw error;
      }
    },
    { rateLimit: true }
  );
}
