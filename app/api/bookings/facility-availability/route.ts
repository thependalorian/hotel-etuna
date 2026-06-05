/**
 * Facility availability — conference session dates and campsite ranges.
 * GET /api/bookings/facility-availability?propertyId=&kind=conference|campsite&from=YYYY-MM-DD&to=YYYY-MM-DD
 */

import { NextRequest } from 'next/server';
import { withApiAuth, errorResponse, successResponse } from '@/lib/utils/api-helpers';
import { BookingService } from '@/lib/services/booking/BookingService';
import { entityId } from '@/lib/validation/entity-ids';
import * as z from 'zod';

const querySchema = z.object({
  propertyId: entityId('Invalid property ID'),
  kind: z.enum(['conference', 'campsite']),
  from: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  to: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
});

export async function GET(request: NextRequest) {
  return withApiAuth(
    request,
    async (req, user) => {
      if (!user.tenantId) {
        return errorResponse('Tenant ID is required', 400, 'MISSING_TENANT_ID');
      }

      const parsed = querySchema.safeParse({
        propertyId: req.nextUrl.searchParams.get('propertyId'),
        kind: req.nextUrl.searchParams.get('kind'),
        from: req.nextUrl.searchParams.get('from'),
        to: req.nextUrl.searchParams.get('to'),
      });

      if (!parsed.success) {
        return errorResponse(
          'Invalid query parameters',
          400,
          'VALIDATION_ERROR',
          parsed.error.flatten().fieldErrors
        );
      }

      const { propertyId, kind, from, to } = parsed.data;
      const result = await new BookingService().getFacilityAvailability(
        propertyId,
        kind,
        from,
        to
      );
      return successResponse(result);
    },
    { requireRole: ['owner', 'manager', 'admin', 'staff'], rateLimit: true }
  );
}
