/**
 * Introducer Bookings API Route
 * 
 * Purpose: Get all bookings attributed to an introducer
 * Location: /app/api/introducers/[id]/bookings/route.ts
 * 
 * Implements:
 * - GET: Fetch all bookings for introducer
 * - Commission calculation
 * - Tenant isolation
 * - Ownership verification
 * 
 * Following System Design Principles:
 * - Part 6: Authorization and ownership checks
 * - Part 1: Parameterized queries
 * - Part 3: RESTful API design
 */

import { NextRequest } from 'next/server';
import { withApiAuth, errorResponse, successResponse } from '@/lib/utils/api-helpers';
import { db, introducers, bookings, guests } from '@/lib/db';
import { eq, and } from 'drizzle-orm';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  return withApiAuth(
    request,
    async (req, user) => {
      if (!user.tenantId) {
        return errorResponse('Tenant ID is required', 400, 'MISSING_TENANT_ID');
      }

      const [introducer] = await db
        .select({ id: introducers.id, tenantId: introducers.tenantId, name: introducers.name })
        .from(introducers)
        .where(eq(introducers.id, params.id))
        .limit(1);

      if (!introducer) {
        return errorResponse('Introducer not found', 404, 'NOT_FOUND');
      }

      if (introducer.tenantId !== user.tenantId) {
        return errorResponse('Access denied', 403, 'FORBIDDEN');
      }

      const introducerBookings = await db
        .select({
          id: bookings.id,
          booking_reference: bookings.bookingReference,
          status: bookings.status,
          check_in_date: bookings.checkInDate,
          check_out_date: bookings.checkOutDate,
          total_amount: bookings.totalAmount,
          commission_amount: bookings.commissionAmount,
          payment_status: bookings.paymentStatus,
          created_at: bookings.createdAt,
          guest_first_name: guests.firstName,
          guest_last_name: guests.lastName,
          guest_email: guests.email,
        })
        .from(bookings)
        .leftJoin(guests, eq(bookings.guestId, guests.id))
        .where(
          and(
            eq(bookings.introducerId, params.id),
            eq(bookings.tenantId, user.tenantId)
          )
        )
        .orderBy(bookings.createdAt);

      const summary = {
        total_bookings: introducerBookings.length,
        total_revenue: introducerBookings.reduce((sum, b) => sum + parseFloat(b.total_amount || '0'), 0),
        total_commission: introducerBookings.reduce((sum, b) => sum + parseFloat(b.commission_amount || '0'), 0),
        by_status: introducerBookings.reduce((acc, b) => {
          acc[b.status || 'unknown'] = (acc[b.status || 'unknown'] || 0) + 1;
          return acc;
        }, {} as Record<string, number>),
      };

      return successResponse({
        introducer: {
          id: introducer.id,
          name: introducer.name,
        },
        summary,
        bookings: introducerBookings,
      });
    },
    {
      requireRole: ['owner', 'manager', 'admin', 'desk'],
      rateLimit: true,
    }
  );
}
