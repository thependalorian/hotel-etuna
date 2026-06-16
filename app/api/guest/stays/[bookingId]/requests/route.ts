/**
 * @fileoverview API route //api/guest/stays/[bookingId]/requests
 * Location: /app/api/guest/stays/[bookingId]/requests/route.ts
 */

/**
 * Guest service & maintenance requests API
 *
 * Purpose: Let an in-stay guest raise housekeeping/amenity requests or report a
 *   maintenance issue from /guest. Housekeeping & maintenance requests spawn a linked
 *   housekeeping task for staff (the agentic guest → staff loop).
 * Location: /app/api/guest/stays/[bookingId]/requests/route.ts
 *
 * GET  response: { data: { requests: [...] } }
 * POST body: { requestType, category?, description?, photos? }
 * POST response: { data: { request, message } }
 *
 * RLS: withApiAuth sets app.tenant_id/type/user_id; guest_service_requests policies
 *      (migration 0052) scope reads/writes to the hub tenant. The API additionally
 *      enforces stay access (guest email match) + guest role.
 */

import { NextRequest } from 'next/server';
import {
  withApiAuth,
  errorResponse,
  successResponse,
} from '@/lib/utils/api-helpers';
import { assertStayAccess } from '@/lib/services/folio/guestStayAccess';
import { GuestServiceRequestService } from '@/lib/services/guest/GuestServiceRequestService';
import { guestServiceRequestSchema } from '@/lib/utils/validation';
import { GUEST_API_ROLES } from '@/lib/auth/roles';
import { isValidEntityIdWithMessage } from '@/lib/validation/entity-ids';
import { AppError } from '@/lib/utils/errors';

const service = new GuestServiceRequestService();

type RouteParams = { params: Promise<{ bookingId: string }> };

export async function GET(request: NextRequest, { params }: RouteParams) {
  return withApiAuth(
    request,
    async (req, user) => {
      const { bookingId } = await params;
      if (!isValidEntityIdWithMessage(bookingId, 'Invalid booking ID')) {
        return errorResponse('Invalid booking ID', 400, 'VALIDATION_ERROR');
      }

      try {
        await assertStayAccess(bookingId, user);
        const requests = await service.listForBooking(bookingId);
        return successResponse({ requests });
      } catch (error) {
        if (error instanceof AppError) {
          return errorResponse(error.message, error.statusCode, 'STAY_ACCESS_ERROR');
        }
        throw error;
      }
    },
    { rateLimit: true, requireRole: [...GUEST_API_ROLES] }
  );
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  return withApiAuth(
    request,
    async (req, user) => {
      const { bookingId } = await params;
      if (!isValidEntityIdWithMessage(bookingId, 'Invalid booking ID')) {
        return errorResponse('Invalid booking ID', 400, 'VALIDATION_ERROR');
      }

      let body: unknown;
      try {
        body = await req.json();
      } catch {
        return errorResponse('Invalid JSON in request body', 400, 'INVALID_JSON');
      }

      const validation = guestServiceRequestSchema.safeParse(body);
      if (!validation.success) {
        return errorResponse(
          'Invalid input',
          400,
          'VALIDATION_ERROR',
          validation.error.flatten().fieldErrors
        );
      }

      try {
        await assertStayAccess(bookingId, user);
        const created = await service.createRequest(bookingId, validation.data, {
          createdByUserId: user.id,
        });
        return successResponse(
          {
            request: created,
            message:
              created.requestType === 'maintenance'
                ? 'Thanks — our maintenance team has been notified.'
                : 'Thanks — your request is on its way to our team.',
          },
          201
        );
      } catch (error) {
        if (error instanceof AppError) {
          return errorResponse(error.message, error.statusCode, 'SERVICE_REQUEST_ERROR');
        }
        throw error;
      }
    },
    { rateLimit: true, requireRole: [...GUEST_API_ROLES] }
  );
}
