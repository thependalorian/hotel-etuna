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

import { NextRequest } from 'next/server';
import { withApiAuth, errorResponse, successResponse } from '@/lib/utils/api-helpers';
import { BookingService } from '@/lib/services/booking/BookingService';
import { db, guests } from '@/lib/db';
import { eq, and } from 'drizzle-orm';
import { entityId } from '@/lib/validation/entity-ids';
import * as z from 'zod';

const bookingSchema = z.object({
  checkInDate: z.string().min(1, 'Check-in date is required'),
  checkOutDate: z.string().min(1, 'Check-out date is required'),
  numGuests: z.number().min(1, 'Number of guests must be at least 1'),
  roomId: entityId('Invalid room ID'),
});

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
            error.meta
          );
        }
        
        // Handle Prisma errors
        if (error.code) {
          return errorResponse(
            error.message || 'Failed to create booking',
            500,
            'BOOKING_CREATION_ERROR',
            { code: error.code, meta: error.meta }
          );
        }
        
        // Generic error
        return errorResponse(
          error.message || 'Internal server error',
          500,
          'INTERNAL_ERROR'
        );
      }
    },
    {
      requireRole: ['owner', 'manager', 'admin'],
      rateLimit: true,
    }
  );
}
