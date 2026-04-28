/**
 * CRM outreach touches — list & create (tenant-scoped)
 *
 * Purpose: Hospitality marketing touches; lifecycle updates on `/api/crm/outreach/[id]`.
 * Response: `{ data: { touches } }` or `{ data: { touch } }` via `successResponse`.
 * Location: app/api/crm/outreach/route.ts
 */

import { NextRequest } from 'next/server';
import * as z from 'zod';
import { withApiAuth, errorResponse, successResponse } from '@/lib/utils/api-helpers';
import { CrmOutreachService } from '@/lib/services/crm/CrmOutreachService';
import { GuestService } from '@/lib/services/booking/GuestService';
import { AppError } from '@/lib/utils/errors';
import { entityId, entityIdNullableOptional, isValidEntityId } from '@/lib/validation/entity-ids';

const outreach = new CrmOutreachService();
const guestService = new GuestService();

const createSchema = z.object({
  guestId: entityId(),
  propertyId: entityIdNullableOptional(),
  channel: z.string().min(1).max(32),
  campaignKey: z.string().max(100).optional().nullable(),
  messageSubject: z.string().max(500).optional().nullable(),
  messageBody: z.string().max(50000).optional().nullable(),
  status: z.literal('draft').optional(),
});

export async function GET(request: NextRequest) {
  return withApiAuth(
    request,
    async (req, user) => {
      if (!user.tenantId) {
        return errorResponse('Tenant ID is required', 400, 'MISSING_TENANT_ID');
      }
      const { searchParams } = new URL(req.url);
      const guestIdParam = searchParams.get('guestId');
      const guestId =
        guestIdParam && isValidEntityId(guestIdParam) ? guestIdParam : undefined;
      const touches = await outreach.listTouches(user.tenantId, guestId ? { guestId } : undefined);
      /** @example `{ data: { touches: CrmOutreachTouch[] } }` */
      return successResponse({ touches });
    },
    { requireRole: ['owner', 'manager', 'admin'], rateLimit: true }
  );
}

export async function POST(request: NextRequest) {
  return withApiAuth(
    request,
    async (req, user) => {
      if (!user.tenantId) {
        return errorResponse('Tenant ID is required', 400, 'MISSING_TENANT_ID');
      }

      let body: unknown;
      try {
        body = await req.json();
      } catch {
        return errorResponse('Invalid JSON body', 400, 'INVALID_JSON');
      }

      const parsed = createSchema.safeParse(body);
      if (!parsed.success) {
        return errorResponse('Invalid request body', 400, 'VALIDATION_ERROR', parsed.error.flatten());
      }

      try {
        await guestService.getGuestById(parsed.data.guestId, user.tenantId);
      } catch (e) {
        if (e instanceof AppError && e.statusCode === 404) {
          return errorResponse('Guest not found', 404, 'GUEST_NOT_FOUND');
        }
        throw e;
      }

      const touch = await outreach.createTouch({
        tenantId: user.tenantId,
        guestId: parsed.data.guestId,
        propertyId: parsed.data.propertyId ?? null,
        channel: parsed.data.channel,
        campaignKey: parsed.data.campaignKey ?? null,
        messageSubject: parsed.data.messageSubject ?? null,
        messageBody: parsed.data.messageBody ?? null,
        status: parsed.data.status ?? 'draft',
      });

      if (!touch) {
        return errorResponse('Failed to create touch', 500, 'CREATE_FAILED');
      }

      /** @example `{ data: { touch: CrmOutreachTouch } }` */
      return successResponse({ touch }, 201);
    },
    { requireRole: ['owner', 'manager', 'admin'], rateLimit: true }
  );
}
