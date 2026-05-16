/**
 * Guest stays list API
 *
 * Purpose: List active stays for the authenticated guest (by email).
 * Location: /app/api/guest/stays/route.ts
 *
 * GET response: { data: { activeStays, paymentDue } }
 */

import { NextRequest } from 'next/server';
import { withApiAuth, errorResponse, successResponse } from '@/lib/utils/api-helpers';
import { GuestStayService } from '@/lib/services/folio/GuestStayService';

const guestStayService = new GuestStayService();

export async function GET(request: NextRequest) {
  return withApiAuth(
    request,
    async (_req, user) => {
      const email = user.primaryEmail || user.email;
      if (!email) {
        return errorResponse('Authenticated email is required', 400, 'MISSING_EMAIL');
      }
      const [activeStays, paymentDue] = await Promise.all([
        guestStayService.listStaysForGuestEmail(email),
        guestStayService.listPaymentDueForGuestEmail(email),
      ]);
      return successResponse({ activeStays, paymentDue });
    },
    { rateLimit: true }
  );
}
