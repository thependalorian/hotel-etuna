/**
 * GET /api/guest/stays/[bookingId]/namqr/status — guest NamQR submission history
 *
 * Response: { data: { items: PendingItem[] } }
 */

import { NextRequest } from 'next/server';
import { withApiAuth, errorResponse, successResponse } from '@/lib/utils/api-helpers';
import { HospitalityNamQrPaymentService } from '@/lib/services/payment/HospitalityNamQrPaymentService';
import { assertStayAccess } from '@/lib/services/folio/guestStayAccess';
import { GUEST_API_ROLES } from '@/lib/auth/roles';
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

      await assertStayAccess(bookingId, user);
      const items = await HospitalityNamQrPaymentService.listPendingForBooking(bookingId);
      return successResponse({ items });
    },
    { rateLimit: true, requireRole: [...GUEST_API_ROLES] }
  );
}
