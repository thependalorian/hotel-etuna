/**
 * @fileoverview API route //api/bookings/[id]/status
 * Location: /app/api/bookings/[id]/status/route.ts
 */

/**
 * Booking status transitions (LangGraph-validated lifecycle)
 *
 * Purpose: checked_in / checked_out / cancel with room side-effects
 * Location: /app/api/bookings/[id]/status/route.ts
 */

import { NextRequest } from 'next/server';
import { withApiAuth, errorResponse, successResponse } from '@/lib/utils/api-helpers';
import { BookingService } from '@/lib/services/booking/BookingService';
import { entityStatusTransitionSchema } from '@/lib/utils/validation';
import { AppError } from '@/lib/utils/errors';

const bookingService = new BookingService();

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  return withApiAuth(
    request,
    async (req, user) => {
      if (!user.tenantId) {
        return errorResponse('Tenant ID is required', 400, 'MISSING_TENANT_ID');
      }
      let body: unknown;
      try {
        body = await request.json();
      } catch {
        return errorResponse('Invalid JSON', 400, 'INVALID_JSON');
      }
      const parsed = entityStatusTransitionSchema.safeParse(body);
      if (!parsed.success) {
        return errorResponse(
          'Invalid input',
          400,
          'VALIDATION_ERROR',
          parsed.error.flatten().fieldErrors
        );
      }
      try {
        const booking = await bookingService.transitionBookingStatus(
          id,
          user.tenantId,
          parsed.data.status
        );
        return successResponse({
          booking,
          workflow: { kind: 'booking_lifecycle', targetStatus: parsed.data.status },
        });
      } catch (e) {
        if (e instanceof AppError) {
          return errorResponse(e.message, e.statusCode, 'BOOKING_TRANSITION');
        }
        throw e;
      }
    },
    { requireRole: ['owner', 'manager', 'admin'], rateLimit: true }
  );
}
