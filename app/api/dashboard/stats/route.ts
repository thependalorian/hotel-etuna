/**
 * @fileoverview API route //api/dashboard/stats
 * Location: /app/api/dashboard/stats/route.ts
 */

/**
 * Dashboard Stats API Route - Drizzle
 * Purpose: Fetch real-time dashboard statistics
 * Location: app/api/dashboard/stats/route.ts
 */

import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import {
  properties,
  bookings,
  restaurantOrders,
  guests,
} from '@/lib/db/schema';
import { eq, and, gte, lte, sql } from 'drizzle-orm';
import { withApiAuth, successResponse } from '@/lib/utils/api-helpers';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  return withApiAuth(
    request,
    async (_req, user) => {
      const tenantId = user.tenantId!;
      const now = new Date();
      const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);

      const [
        propertiesResult,
        currentBookingsResult,
        lastMonthBookingsResult,
        currentOrdersResult,
        lastMonthOrdersResult,
        currentGuestsResult,
        lastMonthGuestsResult,
      ] = await Promise.all([
        db
          .select({ count: sql<number>`count(*)::int` })
          .from(properties)
          .where(eq(properties.tenantId, tenantId)),

        db
          .select({ count: sql<number>`count(*)::int` })
          .from(bookings)
          .where(
            and(
              eq(bookings.tenantId, tenantId),
              gte(bookings.createdAt, currentMonthStart)
            )
          ),

        db
          .select({ count: sql<number>`count(*)::int` })
          .from(bookings)
          .where(
            and(
              eq(bookings.tenantId, tenantId),
              gte(bookings.createdAt, lastMonthStart),
              lte(bookings.createdAt, lastMonthEnd)
            )
          ),

        db
          .select({ count: sql<number>`count(*)::int` })
          .from(restaurantOrders)
          .where(
            and(
              eq(restaurantOrders.tenantId, tenantId),
              gte(restaurantOrders.createdAt, currentMonthStart)
            )
          ),

        db
          .select({ count: sql<number>`count(*)::int` })
          .from(restaurantOrders)
          .where(
            and(
              eq(restaurantOrders.tenantId, tenantId),
              gte(restaurantOrders.createdAt, lastMonthStart),
              lte(restaurantOrders.createdAt, lastMonthEnd)
            )
          ),

        db
          .select({ count: sql<number>`count(distinct ${guests.id})::int` })
          .from(guests)
          .innerJoin(bookings, eq(guests.id, bookings.guestId))
          .where(
            and(
              eq(guests.tenantId, tenantId),
              lte(bookings.checkInDate, now.toISOString().slice(0, 10)),
              gte(bookings.checkOutDate, now.toISOString().slice(0, 10))
            )
          ),

        db
          .select({ count: sql<number>`count(distinct ${guests.id})::int` })
          .from(guests)
          .innerJoin(bookings, eq(guests.id, bookings.guestId))
          .where(
            and(
              eq(guests.tenantId, tenantId),
              lte(bookings.checkInDate, lastMonthEnd.toISOString().slice(0, 10)),
              gte(bookings.checkOutDate, lastMonthStart.toISOString().slice(0, 10))
            )
          ),
      ]);

      const propertiesCount = Number(propertiesResult[0]?.count ?? 0);
      const currentBookings = Number(currentBookingsResult[0]?.count ?? 0);
      const lastMonthBookings = Number(lastMonthBookingsResult[0]?.count ?? 0);
      const currentOrders = Number(currentOrdersResult[0]?.count ?? 0);
      const lastMonthOrders = Number(lastMonthOrdersResult[0]?.count ?? 0);
      const currentGuests = Number(currentGuestsResult[0]?.count ?? 0);
      const lastMonthGuests = Number(lastMonthGuestsResult[0]?.count ?? 0);

      const bookingChange =
        lastMonthBookings > 0
          ? ((currentBookings - lastMonthBookings) / lastMonthBookings) * 100
          : currentBookings > 0
            ? 100
            : 0;
      const orderChange =
        lastMonthOrders > 0
          ? ((currentOrders - lastMonthOrders) / lastMonthOrders) * 100
          : currentOrders > 0
            ? 100
            : 0;
      const guestChange =
        lastMonthGuests > 0
          ? ((currentGuests - lastMonthGuests) / lastMonthGuests) * 100
          : currentGuests > 0
            ? 100
            : 0;

      return successResponse({
        properties: { total: propertiesCount, change: 0 },
        bookings: {
          total: currentBookings,
          change: Math.round(bookingChange * 10) / 10,
        },
        orders: {
          total: currentOrders,
          change: Math.round(orderChange * 10) / 10,
        },
        guests: {
          total: currentGuests,
          change: Math.round(guestChange * 10) / 10,
        },
      });
    },
    {
      requireRole: ['owner', 'manager', 'admin'],
      rateLimit: true,
    }
  );
}
