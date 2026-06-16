/**
 * @fileoverview API route //api/restaurant/reservations/cancel
 * Location: /app/api/restaurant/reservations/cancel/route.ts
 */

/**
 * Cancel dining reservation with booking code + OTP (Enish-style).
 * POST body: { bookingCode, otp }
 * Response: { data: { cancelled: true } } | error
 * Location: app/api/restaurant/reservations/cancel/route.ts
 */

import { NextRequest } from 'next/server';
import * as z from 'zod';
import { withApiAuth, errorResponse, successResponse } from '@/lib/utils/api-helpers';
import { DiningReservationService } from '@/lib/services/sofia/DiningReservationService';

const schema = z.object({
  bookingCode: z.string().min(4).max(12),
  otp: z.string().length(6),
});

const service = new DiningReservationService();

export async function POST(request: NextRequest) {
  return withApiAuth(
    request,
    async (req, user) => {
      if (!user.tenantId) {
        return errorResponse('Tenant ID is required', 400, 'MISSING_TENANT_ID');
      }
      const body = await req.json();
      const parsed = schema.safeParse(body);
      if (!parsed.success) {
        return errorResponse('Invalid request', 400, 'VALIDATION_ERROR', parsed.error.flatten());
      }

      const result = await service.cancelWithOtp(
        user.tenantId,
        parsed.data.bookingCode,
        parsed.data.otp
      );
      if (!result.ok) {
        const status = result.error === 'BOOKING_NOT_FOUND' ? 404 : 400;
        return errorResponse(result.error ?? 'Cancel failed', status, result.error);
      }
      return successResponse({ cancelled: true });
    },
    { rateLimit: true }
  );
}
