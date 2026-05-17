/**
 * Staff manual confirm for dining reservation (primary path is Adumo redirect/webhook).
 * POST body: { bookingCode, adumoTransactionIndex? }
 * Response: { data: { confirmed: true } }
 * Location: app/api/restaurant/reservations/confirm/route.ts
 */

import { NextRequest } from 'next/server';
import * as z from 'zod';
import { withApiAuth, errorResponse, successResponse } from '@/lib/utils/api-helpers';
import { DiningReservationService } from '@/lib/services/sofia/DiningReservationService';

const schema = z.object({
  bookingCode: z.string().min(4).max(12),
  adumoTransactionIndex: z.string().max(255).optional(),
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

      const result = await service.confirmDepositManual(
        user.tenantId,
        parsed.data.bookingCode,
        parsed.data.adumoTransactionIndex
      );
      if (!result.ok) {
        const status = result.error === 'BOOKING_NOT_FOUND' ? 404 : 400;
        return errorResponse(result.error ?? 'Confirm failed', status, result.error);
      }
      return successResponse({ confirmed: true });
    },
    { requireRole: ['owner', 'manager', 'admin'], rateLimit: true }
  );
}
