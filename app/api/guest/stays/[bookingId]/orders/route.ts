/**
 * Guest room service orders API
 *
 * Purpose: Place F&B orders charged to the stay folio while checked in.
 * Location: /app/api/guest/stays/[bookingId]/orders/route.ts
 *
 * POST body: { items: [{ menuItemId, quantity, ... }], roomNumber?, specialInstructions? }
 * POST response: { data: { order, orderTotal, folioLineId, message } }
 */

import { NextRequest } from 'next/server';
import {
  withApiAuth,
  errorResponse,
  successResponse,
} from '@/lib/utils/api-helpers';
import { FolioService } from '@/lib/services/folio/FolioService';
import { assertStayAccess } from '@/lib/services/folio/guestStayAccess';
import { guestRoomServiceOrderSchema } from '@/lib/utils/validation';
import { entityId } from '@/lib/validation/entity-ids';
import { AppError } from '@/lib/utils/errors';

const folioService = new FolioService();

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

      await assertStayAccess(bookingId, user);

      let body: unknown;
      try {
        body = await req.json();
      } catch {
        return errorResponse('Invalid JSON in request body', 400, 'INVALID_JSON');
      }

      const validation = guestRoomServiceOrderSchema.safeParse(body);
      if (!validation.success) {
        return errorResponse(
          'Invalid input',
          400,
          'VALIDATION_ERROR',
          validation.error.flatten().fieldErrors
        );
      }

      try {
        const result = await folioService.createRoomServiceOrder(
          bookingId,
          validation.data.items,
          {
            roomNumber: validation.data.roomNumber,
            specialInstructions: validation.data.specialInstructions,
            createdByUserId: user.id,
          }
        );

        return successResponse(
          {
            order: result.order,
            orderTotal: result.orderTotal,
            folioLineId: result.folioLineId,
            message: 'Order placed and charged to your room folio',
          },
          201
        );
      } catch (error) {
        if (error instanceof AppError) {
          return errorResponse(error.message, error.statusCode, 'FOLIO_ORDER_ERROR');
        }
        throw error;
      }
    },
    { rateLimit: true }
  );
}
