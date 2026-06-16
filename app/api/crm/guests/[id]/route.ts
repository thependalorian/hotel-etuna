/**
 * @fileoverview API route //api/crm/guests/[id]
 * Location: /app/api/crm/guests/[id]/route.ts
 */

import { NextRequest } from 'next/server';
import {
  withPlatformApiAuth,
  errorResponse,
  successResponse,
} from '@/lib/utils/api-helpers';
import { GuestService } from '@/lib/services/booking/GuestService';
import { recordAuditTrail } from '@/lib/compliance/record-audit';
import { CrmConsentService } from '@/lib/services/crm/CrmConsentService';
import { securityLogger } from '@/lib/utils/security-logger';

const guestService = new GuestService();
const consentService = new CrmConsentService();

type RouteParams = { params: Promise<{ id: string }> };

export async function GET(request: NextRequest, { params }: RouteParams) {
  return withPlatformApiAuth(
    request,
    async (_req, user) => {
      if (!user.tenantId) {
        return errorResponse('Unauthorized', 401, 'UNAUTHORIZED');
      }

      const { id } = await params;

      try {
        const guest = await guestService.getGuestById(id, user.tenantId);
        if (!guest) {
          return errorResponse('Guest not found', 404, 'NOT_FOUND');
        }
        return successResponse(guest);
      } catch (error) {
        securityLogger.error('Error fetching guest:', error);
        return errorResponse('Internal server error', 500, 'INTERNAL_ERROR');
      }
    },
    { rateLimit: true }
  );
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  return withPlatformApiAuth(
    request,
    async (req, user) => {
      if (!user.tenantId) {
        return errorResponse('Unauthorized', 401, 'UNAUTHORIZED');
      }

      const { id } = await params;

      try {
        const body = await req.json();
        const currentGuest = await guestService.getGuestById(id, user.tenantId);
        if (!currentGuest) {
          return errorResponse('Guest not found', 404, 'NOT_FOUND');
        }

        const { marketingConsent, consentReason, consentSource, ...profilePatch } = body;

        let updatedGuest = currentGuest;
        if (Object.keys(profilePatch).length > 0) {
          updatedGuest = await guestService.updateGuest(id, user.tenantId, profilePatch);
        }

        if (
          typeof marketingConsent === 'boolean' &&
          currentGuest.marketingConsent !== marketingConsent
        ) {
          const event = await consentService.recordConsentChange({
            tenantId: user.tenantId,
            guestId: id,
            previousMarketingConsent: currentGuest.marketingConsent === true,
            newMarketingConsent: marketingConsent,
            source: typeof consentSource === 'string' ? consentSource : 'guest_profile_update',
            reason: typeof consentReason === 'string' ? consentReason : null,
            changedByUserId: user.id,
            metadata: { route: '/api/crm/guests/[id]' },
          });

          await recordAuditTrail({
            tenantId: user.tenantId,
            userId: user.id,
            action: 'crm.guest.marketing_consent_changed',
            resourceType: 'guest',
            resourceId: id,
            oldValues: { marketingConsent: event.previousMarketingConsent },
            newValues: {
              marketingConsent: event.newMarketingConsent,
              consentEventId: event.id,
              source: event.source,
            },
            request: req,
          });

          updatedGuest = await guestService.getGuestById(id, user.tenantId);
        }

        if (!updatedGuest) {
          return errorResponse('Guest not found or update failed', 404, 'NOT_FOUND');
        }
        return successResponse(updatedGuest);
      } catch (error) {
        securityLogger.error('Error updating guest:', error);
        return errorResponse('Internal server error', 500, 'INTERNAL_ERROR');
      }
    },
    { rateLimit: true }
  );
}
