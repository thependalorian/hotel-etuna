/**
 * @fileoverview API route //api/bookings/search
 * Location: /app/api/bookings/search/route.ts
 */

/**
 * GET /api/bookings/search — staff booking lookup for payments desk.
 * Location: app/api/bookings/search/route.ts
 *
 * Query: ?q=ETU-123 or guest name or booking UUID
 * Response: { data: { items: [{ id, bookingReference, status, checkInDate, checkOutDate, guestName }] } }
 */

import { NextRequest } from 'next/server';
import { z } from 'zod';
import { withApiAuth, errorResponse, successResponse } from '@/lib/utils/api-helpers';
import { BookingService } from '@/lib/services/booking/BookingService';

const STAFF_ROLES = ['admin', 'staff', 'manager', 'owner', 'super-admin'] as const;

const searchQuerySchema = z.object({
  q: z.string().trim().min(2, 'Enter at least 2 characters').max(100),
});

export async function GET(request: NextRequest) {
  return withApiAuth(
    request,
    async (req, user) => {
      if (!user.tenantId) {
        return errorResponse('Tenant ID is required', 400, 'MISSING_TENANT_ID');
      }

      const parsed = searchQuerySchema.safeParse({
        q: req.nextUrl.searchParams.get('q') ?? '',
      });

      if (!parsed.success) {
        return errorResponse(
          'Invalid query',
          400,
          'VALIDATION_ERROR',
          parsed.error.flatten().fieldErrors
        );
      }

      const bookingService = new BookingService();
      const items = await bookingService.searchBookingsForDesk(
        user.tenantId,
        parsed.data.q
      );

      return successResponse({ items });
    },
    { rateLimit: true, requireRole: [...STAFF_ROLES] }
  );
}
