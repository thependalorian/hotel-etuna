/**
 * Guest folio settlement API
 *
 * Purpose: Pay open folio balance (F&B/incidentals) during stay or before checkout.
 * Location: /app/api/guest/stays/[bookingId]/settle/route.ts
 *
 * POST body: { paymentMethod: 'cash' | 'card', amountPaid?: number }
 * POST response: { data: { outstanding, transactionReference, pointsEarned } }
 *
 * Supports partial cash/card payments; pass gatewayTransactionId after card capture.
 */

import { NextRequest } from 'next/server';
import {
  withApiAuth,
  errorResponse,
  successResponse,
} from '@/lib/utils/api-helpers';
import { FolioService } from '@/lib/services/folio/FolioService';
import { assertStayAccess } from '@/lib/services/folio/guestStayAccess';
import { guestFolioSettleSchema } from '@/lib/utils/validation';
import { GUEST_API_ROLES } from '@/lib/auth/roles';
import { isValidEntityIdWithMessage } from '@/lib/validation/entity-ids';
import { AppError } from '@/lib/utils/errors';

const folioService = new FolioService();

type RouteParams = { params: Promise<{ bookingId: string }> };

export async function POST(request: NextRequest, { params }: RouteParams) {
  return withApiAuth(
    request,
    async (req, user) => {
      const { bookingId } = await params;
      if (!isValidEntityIdWithMessage(bookingId, 'Invalid booking ID')) {
        return errorResponse('Invalid booking ID', 400, 'VALIDATION_ERROR');
      }

      await assertStayAccess(bookingId, user);

      let body: unknown;
      try {
        body = await req.json();
      } catch {
        return errorResponse('Invalid JSON in request body', 400, 'INVALID_JSON');
      }

      const validation = guestFolioSettleSchema.safeParse(body);
      if (!validation.success) {
        return errorResponse(
          'Invalid input',
          400,
          'VALIDATION_ERROR',
          validation.error.flatten().fieldErrors
        );
      }

      if (
        validation.data.paymentMethod === 'card' &&
        !validation.data.gatewayTransactionId
      ) {
        return errorResponse(
          'Card settlement requires gatewayTransactionId from payment capture',
          400,
          'MISSING_GATEWAY_REFERENCE'
        );
      }

      try {
        const result = await folioService.settleFolio(bookingId, {
          paymentMethod: validation.data.paymentMethod,
          amountPaid: validation.data.amountPaid,
          userId: user.id,
          gatewayTransactionId: validation.data.gatewayTransactionId,
        });

        return successResponse({
          ...result,
          message: result.folioClosed
            ? 'Folio settled in full. Thank you.'
            : `Payment recorded. Balance remaining: ${result.balanceRemaining} ${(await folioService.getFolio(bookingId)).currency}`,
        });
      } catch (error) {
        if (error instanceof AppError) {
          return errorResponse(error.message, error.statusCode, 'FOLIO_SETTLE_ERROR');
        }
        throw error;
      }
    },
    { rateLimit: true, requireRole: [...GUEST_API_ROLES] }
  );
}
