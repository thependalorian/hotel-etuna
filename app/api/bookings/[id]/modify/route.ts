/**
 * @fileoverview API route POST /api/bookings/[id]/modify
 * Location: /app/api/bookings/[id]/modify/route.ts
 *
 * Staff-initiated booking modification: extend a stay or change/upgrade/downgrade the room.
 * Re-quotes, re-checks availability, reprices the folio, and audits via BookingModificationService.
 * Request: { action: 'extend', newCheckOutDate: 'YYYY-MM-DD' } | { action: 'change_room', newRoomId }
 * Response: { bookingId, previousTotal, newTotal, delta, currency }
 */
import { NextRequest } from 'next/server';
import { z } from 'zod';
import { withApiAuth, errorResponse, successResponse } from '@/lib/utils/api-helpers';
import { bookingModificationService } from '@/lib/services/booking/BookingModificationService';
import { AppError } from '@/lib/utils/errors';

const modifySchema = z.discriminatedUnion('action', [
  z.object({
    action: z.literal('extend'),
    newCheckOutDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Expected YYYY-MM-DD'),
  }),
  z.object({
    action: z.literal('change_room'),
    newRoomId: z.string().uuid(),
  }),
]);

export async function POST(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  return withApiAuth(
    request,
    async (req, user) => {
      if (!user.tenantId) {
        return errorResponse('Tenant ID is required', 400, 'MISSING_TENANT_ID');
      }
      let body: unknown;
      try {
        body = await request.json();
      } catch {
        return errorResponse('Invalid JSON', 400, 'INVALID_JSON');
      }
      const parsed = modifySchema.safeParse(body);
      if (!parsed.success) {
        return errorResponse('Invalid input', 400, 'VALIDATION_ERROR', parsed.error.flatten().fieldErrors);
      }

      try {
        const result =
          parsed.data.action === 'extend'
            ? await bookingModificationService.extendStay({
                bookingId: id,
                tenantId: user.tenantId,
                newCheckOutDate: parsed.data.newCheckOutDate,
                actorUserId: user.id ?? null,
                request: req,
              })
            : await bookingModificationService.changeRoom({
                bookingId: id,
                tenantId: user.tenantId,
                newRoomId: parsed.data.newRoomId,
                actorUserId: user.id ?? null,
                request: req,
              });
        return successResponse(result);
      } catch (e) {
        if (e instanceof AppError) {
          return errorResponse(e.message, e.statusCode, 'BOOKING_MODIFY');
        }
        throw e;
      }
    },
    { requireRole: ['owner', 'manager', 'admin'], rateLimit: true },
  );
}
