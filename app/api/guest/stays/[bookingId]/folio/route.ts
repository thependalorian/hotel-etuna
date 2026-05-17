/**
 * Guest stay folio API
 *
 * Purpose: Return open/settled folio lines for a booking (guest or hub staff).
 * Location: /app/api/guest/stays/[bookingId]/folio/route.ts
 *
 * GET response: { data: FolioSummary }
 */

import { NextRequest } from 'next/server';
import {
  withApiAuth,
  errorResponse,
  successResponse,
} from '@/lib/utils/api-helpers';
import { FolioService } from '@/lib/services/folio/FolioService';
import { assertStayAccess } from '@/lib/services/folio/guestStayAccess';
import { GUEST_API_ROLES } from '@/lib/auth/roles';
import { entityId } from '@/lib/validation/entity-ids';

const folioService = new FolioService();

type RouteParams = { params: Promise<{ bookingId: string }> };

export async function GET(request: NextRequest, { params }: RouteParams) {
  return withApiAuth(
    request,
    async (req, user) => {
      const { bookingId } = await params;
      const idCheck = entityId('Invalid booking ID').safeParse(bookingId);
      if (!idCheck.success) {
        return errorResponse('Invalid booking ID', 400, 'VALIDATION_ERROR');
      }

      await assertStayAccess(bookingId, user);
      const folio = await folioService.getFolio(bookingId);
      return successResponse(folio);
    },
    { rateLimit: true, requireRole: [...GUEST_API_ROLES] }
  );
}
