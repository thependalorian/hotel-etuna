/**
 * Guest loyalty redemption API
 *
 * Purpose: Redeem points for a folio discount on an active checked-in stay.
 * Location: /app/api/guest/loyalty/redeem/route.ts
 *
 * POST body: { bookingId, pointsToRedeem }
 */

import { NextRequest } from 'next/server';
import {
  withApiAuth,
  errorResponse,
  successResponse,
} from '@/lib/utils/api-helpers';
import { CustomerService } from '@/lib/services/crm/CustomerService';
import { FolioService } from '@/lib/services/folio/FolioService';
import { assertStayAccess } from '@/lib/services/folio/guestStayAccess';
import { guestLoyaltyRedeemSchema } from '@/lib/utils/validation';
import { AppError } from '@/lib/utils/errors';

const customerService = new CustomerService();
const folioService = new FolioService();

export async function POST(request: NextRequest) {
  return withApiAuth(
    request,
    async (req, user) => {
      let body: unknown;
      try {
        body = await req.json();
      } catch {
        return errorResponse('Invalid JSON in request body', 400, 'INVALID_JSON');
      }

      const validation = guestLoyaltyRedeemSchema.safeParse(body);
      if (!validation.success) {
        return errorResponse(
          'Invalid input',
          400,
          'VALIDATION_ERROR',
          validation.error.flatten().fieldErrors
        );
      }

      const { bookingId, pointsToRedeem } = validation.data;
      const ctx = await assertStayAccess(bookingId, user);

      try {
        const redemption = await customerService.redeemLoyaltyPoints(
          ctx.guest.id,
          ctx.booking.tenantId!,
          pointsToRedeem
        );

        await folioService.applyLoyaltyAdjustment(bookingId, {
          pointsRedeemed: redemption.pointsRedeemed,
          discountAmount: redemption.discountAmount,
          description: `Loyalty redemption (${redemption.pointsRedeemed} pts)`,
        });

        const folio = await folioService.getFolio(bookingId);

        return successResponse({
          ...redemption,
          balanceDue: folio.balanceDue,
          message: 'Loyalty discount applied to your folio',
        });
      } catch (error) {
        if (error instanceof AppError) {
          return errorResponse(error.message, error.statusCode, 'LOYALTY_REDEEM_ERROR');
        }
        throw error;
      }
    },
    { rateLimit: true }
  );
}
