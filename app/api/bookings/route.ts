/**
 * Bookings API Route
 * 
 * Purpose: Manage bookings with system design principles
 * Location: /app/api/bookings/route.ts
 * 
 * Implements:
 * - Authentication & authorization
 * - Rate limiting
 * - Tenant isolation
 * - Input validation
 * - Error handling
 * 
 * Following System Design Principles:
 * - API Design Best Practices
 * - Security Architecture
 * - Multi-Tenancy Strategy
 */

import { NextRequest, NextResponse } from 'next/server';
import { withApiAuth, errorResponse, successResponse } from '@/lib/utils/api-helpers';
import { BookingService } from '@/lib/services/booking/BookingService';
import { db, guests } from '@/lib/db';
import { eq, and } from 'drizzle-orm';
import { entityId } from '@/lib/validation/entity-ids';
import * as z from 'zod';

const listBookingsQuerySchema = z.object({
  propertyId: entityId('Invalid property ID'),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'startDate must be YYYY-MM-DD').optional(),
});

const bookingSchema = z.object({
  checkInDate: z.string().min(1, 'Check-in date is required'),
  checkOutDate: z.string().min(1, 'Check-out date is required'),
  numGuests: z.number().min(1, 'Number of guests must be at least 1'),
  roomId: entityId('Invalid room ID'),
});

export async function GET(request: NextRequest) {
  return withApiAuth(
    request,
    async (req, user) => {
      if (!user.tenantId) {
        return errorResponse('Tenant ID is required', 400, 'MISSING_TENANT_ID');
      }

      const parsed = listBookingsQuerySchema.safeParse({
        propertyId: req.nextUrl.searchParams.get('propertyId'),
        startDate: req.nextUrl.searchParams.get('startDate') ?? undefined,
      });

      if (!parsed.success) {
        return errorResponse(
          'Invalid query parameters',
          400,
          'VALIDATION_ERROR',
          parsed.error.flatten().fieldErrors
        );
      }

      const { propertyId, startDate } = parsed.data;
      const bookingService = new BookingService();
      let rows: Awaited<ReturnType<BookingService['getBookingsForProperty']>>;

      if (startDate) {
        const monthStart = new Date(startDate);
        const monthEnd = new Date(monthStart.getFullYear(), monthStart.getMonth() + 1, 0);
        const startIso = monthStart.toISOString().slice(0, 10);
        const endIso = monthEnd.toISOString().slice(0, 10);
        rows = await bookingService.getBookingsForPropertyInDateRange(
          propertyId,
          user.tenantId,
          startIso,
          endIso
        );
      } else {
        rows = await bookingService.getBookingsForProperty(propertyId, user.tenantId);
      }

      const calendarRows = rows.map((b) => ({
        id: b.id,
        checkInDate: b.check_in_date ?? b.checkInDate,
        checkOutDate: b.check_out_date ?? b.checkOutDate,
        startDate: b.check_in_date ?? b.checkInDate,
        endDate: b.check_out_date ?? b.checkOutDate,
        status: b.status,
      }));

      /** BookingCalendar expects a top-level array (same as /api/bookings/availability). */
      return NextResponse.json(calendarRows);
    },
    {
      requireRole: ['owner', 'manager', 'admin', 'staff'],
      rateLimit: true,
    }
  );
}

export async function POST(request: NextRequest) {
  return withApiAuth(
    request,
    async (req, user) => {
      let body;
      try {
        body = await request.json();
      } catch (error) {
        return errorResponse('Invalid JSON in request body', 400, 'INVALID_JSON');
      }

      const validation = bookingSchema.safeParse(body);

      if (!validation.success) {
        return errorResponse(
          'Invalid input',
          400,
          'VALIDATION_ERROR',
          validation.error.flatten().fieldErrors
        );
      }

      const { checkInDate, checkOutDate, numGuests, roomId } = validation.data;

      // Find or create a guest record for the logged-in user
      const userEmail = (user as any).primaryEmail || user.email;
      if (!userEmail) {
        return errorResponse('User email is required', 400, 'MISSING_EMAIL');
      }

      const [existingGuest] = await db.select().from(guests).where(eq(guests.email, userEmail)).limit(1);
      let guest = existingGuest ?? null;

      if (!guest) {
        if (!user.tenantId) {
          return errorResponse('Tenant ID is required', 400, 'MISSING_TENANT_ID');
        }
        const displayName = (user as any).displayName || user.email || '';
        const [created] = await db.insert(guests).values({
          email: userEmail,
          firstName: displayName.split(' ')[0] || '',
          lastName: displayName.split(' ').slice(1).join(' ') || '',
          tenantId: user.tenantId,
        }).returning();
        guest = created ?? null;
      }
      if (!guest) {
        return errorResponse('Failed to resolve guest', 500, 'GUEST_ERROR');
      }

      const bookingService = new BookingService();
      let newBooking;
      try {
        newBooking = await bookingService.createBooking({
          checkInDate: new Date(checkInDate),
          checkOutDate: new Date(checkOutDate),
          numGuests,
          roomId,
          guestId: guest.id,
        });

        return successResponse(newBooking, 201);
      } catch (error: any) {
        console.error('[POST /api/bookings] BookingService error:', {
          message: error.message,
          code: error.code,
          statusCode: error.statusCode,
          meta: error.meta,
        });
        
        // Handle AppError with status codes
        if (error.statusCode) {
          return errorResponse(
            error.message,
            error.statusCode,
            error.code || 'BOOKING_ERROR',
            process.env.NODE_ENV === 'production' ? undefined : error.meta
          );
        }
        
        // Handle Prisma errors
        if (error.code) {
          return errorResponse(
            error.message || 'Failed to create booking',
            500,
            'BOOKING_CREATION_ERROR',
            process.env.NODE_ENV === 'production'
              ? { code: error.code }
              : { code: error.code, meta: error.meta }
          );
        }
        
        return errorResponse('Internal server error', 500, 'INTERNAL_ERROR');
      }
    },
    {
      requireRole: ['owner', 'manager', 'admin'],
      rateLimit: true,
    }
  );
}
