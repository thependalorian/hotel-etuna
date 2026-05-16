/**
 * Guest stay menu API
 *
 * Purpose: Menu for room service on a stay's property.
 * Location: /app/api/guest/stays/[bookingId]/menu/route.ts
 */

import { NextRequest } from 'next/server';
import { withApiAuth, errorResponse, successResponse } from '@/lib/utils/api-helpers';
import { assertStayAccess } from '@/lib/services/folio/guestStayAccess';
import { getCompleteMenuForProperty } from '@/lib/data/dining';
import { entityId } from '@/lib/validation/entity-ids';

type RouteParams = { params: Promise<{ bookingId: string }> };

export async function GET(request: NextRequest, { params }: RouteParams) {
  return withApiAuth(
    request,
    async (_req, user) => {
      const { bookingId } = await params;
      const idCheck = entityId('Invalid booking ID').safeParse(bookingId);
      if (!idCheck.success) {
        return errorResponse('Invalid booking ID', 400, 'VALIDATION_ERROR');
      }

      const { booking } = await assertStayAccess(bookingId, user);
      if (!booking.propertyId) {
        return errorResponse('Booking has no property', 400, 'MISSING_PROPERTY');
      }

      const menu = await getCompleteMenuForProperty(booking.propertyId);
      if (!menu.restaurant) {
        return errorResponse('Property menu not available', 404, 'MENU_NOT_FOUND');
      }
      return successResponse({
        restaurant: menu.restaurant,
        categories: menu.categories,
        itemsByCategory: Object.fromEntries(menu.itemsByCategory),
      });
    },
    { rateLimit: true }
  );
}
