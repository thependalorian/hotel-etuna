/**
 * Guest profile API — the signed-in guest's own contact details + stay preferences.
 *
 * GUEST SELF-SERVICE portal (singular `guest`) — the authenticated guest acts on
 * their own record. Distinct from the staff CRM at /api/guests (plural) and
 * /api/crm/guests, which let staff manage all guests.
 *
 * Location: app/api/guest/profile/route.ts
 *
 * GET   → { data: GuestProfile }
 * PATCH → { data: GuestProfile }  (partial; email is read-only)
 * Auth: withApiAuth + GUEST_API_ROLES; guest resolved by authenticated email.
 */

import { NextRequest } from 'next/server';
import { z } from 'zod';
import { withApiAuth, errorResponse, successResponse } from '@/lib/utils/api-helpers';
import { GUEST_API_ROLES } from '@/lib/auth/roles';
import { GuestProfileService } from '@/lib/services/guest/GuestProfileService';

const guestProfileService = new GuestProfileService();

const optionalString = z.string().trim().max(255).nullish();

const patchSchema = z.object({
  firstName: z.string().trim().max(100).nullish(),
  lastName: z.string().trim().max(100).nullish(),
  phone: z.string().trim().max(50).nullish(),
  nationality: optionalString,
  address: z.string().trim().max(500).nullish(),
  city: optionalString,
  country: optionalString,
  postalCode: z.string().trim().max(20).nullish(),
  marketingConsent: z.boolean().optional(),
  preferredRoomType: optionalString,
  dietaryRestrictions: z.array(z.string().trim().max(120)).max(30).optional(),
  accessibilityNeeds: z.array(z.string().trim().max(120)).max(30).optional(),
});

export async function GET(request: NextRequest) {
  return withApiAuth(
    request,
    async (_req, user) => {
      const email = user.primaryEmail || user.email;
      if (!email) {
        return errorResponse('Authenticated email is required', 400, 'MISSING_EMAIL');
      }
      const profile = await guestProfileService.getByEmail(email);
      if (!profile) {
        return errorResponse('No guest profile found for this account', 404, 'NOT_FOUND');
      }
      return successResponse(profile);
    },
    { rateLimit: true, requireRole: [...GUEST_API_ROLES] },
  );
}

export async function PATCH(request: NextRequest) {
  return withApiAuth(
    request,
    async (req, user) => {
      const email = user.primaryEmail || user.email;
      if (!email) {
        return errorResponse('Authenticated email is required', 400, 'MISSING_EMAIL');
      }

      let body: unknown;
      try {
        body = await req.json();
      } catch {
        return errorResponse('Invalid JSON', 400, 'INVALID_JSON');
      }

      const parsed = patchSchema.safeParse(body);
      if (!parsed.success) {
        return errorResponse('Invalid input', 400, 'VALIDATION_ERROR', parsed.error.flatten().fieldErrors);
      }

      const updated = await guestProfileService.updateByEmail(email, parsed.data);
      if (!updated) {
        return errorResponse('No guest profile found for this account', 404, 'NOT_FOUND');
      }
      return successResponse(updated);
    },
    { rateLimit: true, requireRole: [...GUEST_API_ROLES] },
  );
}
