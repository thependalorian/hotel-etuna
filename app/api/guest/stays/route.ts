/**
 * @fileoverview API route //api/guest/stays
 * Location: /app/api/guest/stays/route.ts
 */

/**
 * Guest stays list API
 *
 * GUEST SELF-SERVICE portal (singular `guest`) — the authenticated guest views
 * their own stays. Distinct from the staff CRM at /api/guests (plural) and
 * /api/crm/guests.
 *
 * Purpose: List active stays for the authenticated guest (by email).
 * Location: /app/api/guest/stays/route.ts
 *
 * GET response: { data: { activeStays, paymentDue, pastStays, loyalty } }
 */

import { NextRequest } from 'next/server';
import { withApiAuth, errorResponse, successResponse } from '@/lib/utils/api-helpers';
import { GUEST_API_ROLES } from '@/lib/auth/roles';
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
      const [activeStays, paymentDue, pastStays, loyalty] = await Promise.all([
        guestStayService.listStaysForGuestEmail(email),
        guestStayService.listPaymentDueForGuestEmail(email),
        guestStayService.listPastStaysForGuestEmail(email),
        guestStayService.getLoyaltySummaryForGuestEmail(email),
      ]);
      return successResponse({ activeStays, paymentDue, pastStays, loyalty });
    },
    { rateLimit: true, requireRole: [...GUEST_API_ROLES] }
  );
}
