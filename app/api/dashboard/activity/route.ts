/**
 * @fileoverview API route //api/dashboard/activity
 * Location: /app/api/dashboard/activity/route.ts
 */

/**
 * Dashboard Recent Activity API Route
 * 
 * Purpose: Fetch recent booking and order activity
 * Location: /app/api/activity/route.ts
 * 
 * Returns:
 * - Recent bookings (last 5)
 * - Recent orders (last 5)
 * - Combined and sorted by date
 */

import { NextResponse, NextRequest } from 'next/server';
import { withTenantApiAuth } from '@/lib/utils/api-helpers';
import { db, bookings, properties, bookingRooms, rooms, restaurantOrders, restaurants } from '@/lib/db';
import { eq, desc } from 'drizzle-orm';
import { AppError } from '@/lib/utils/errors';
import { formatDistanceToNow } from 'date-fns';
import { securityLogger } from '@/lib/utils/security-logger';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  return withTenantApiAuth(request, async (req, user) => {
    try {
      const tenantId = user.tenantId as string;
      const limit = parseInt(req.nextUrl.searchParams.get('limit') || '5');

      // Fetch recent bookings with property name and first room number
      const recentBookingsRows = await db
        .select({
          id: bookings.id,
          status: bookings.status,
          createdAt: bookings.createdAt,
          propertyName: properties.name,
          roomNumber: rooms.roomNumber,
        })
        .from(bookings)
        .leftJoin(properties, eq(bookings.propertyId, properties.id))
        .leftJoin(bookingRooms, eq(bookings.id, bookingRooms.bookingId))
        .leftJoin(rooms, eq(bookingRooms.roomId, rooms.id))
        .where(eq(bookings.tenantId, tenantId))
        .orderBy(desc(bookings.createdAt))
        .limit(limit * 2); // oversample then dedupe by booking id

      const seen = new Set<string>();
      const recentBookings = recentBookingsRows.filter((r) => {
        if (seen.has(r.id)) return false;
        seen.add(r.id);
        return true;
      }).slice(0, limit);

      // Fetch recent orders with restaurant and property name
      const recentOrders = await db
        .select({
          id: restaurantOrders.id,
          orderNumber: restaurantOrders.orderNumber,
          status: restaurantOrders.status,
          createdAt: restaurantOrders.createdAt,
          restaurantName: restaurants.name,
          propertyName: properties.name,
        })
        .from(restaurantOrders)
        .innerJoin(restaurants, eq(restaurantOrders.restaurantId, restaurants.id))
        .innerJoin(properties, eq(restaurants.propertyId, properties.id))
        .where(eq(properties.tenantId, tenantId))
        .orderBy(desc(restaurantOrders.createdAt))
        .limit(limit);

      const activities = [
        ...recentBookings.map((b) => ({
          id: b.id,
          type: 'booking' as const,
          description: `New booking received - ${b.roomNumber ? `Room ${b.roomNumber}` : b.propertyName || 'Property'}`,
          time: formatDistanceToNow(new Date(b.createdAt ?? 0), { addSuffix: true }),
          status: (b.status ?? '').toLowerCase(),
          createdAt: b.createdAt,
        })),
        ...recentOrders.map((o) => ({
          id: o.id,
          type: 'order' as const,
          description: `Restaurant order #${o.orderNumber || o.id.slice(0, 8)} - ${o.restaurantName || 'Restaurant'}`,
          time: formatDistanceToNow(new Date(o.createdAt ?? 0), { addSuffix: true }),
          status: (o.status ?? '').toLowerCase(),
          createdAt: o.createdAt,
        })),
      ]
        .sort((a, b) => new Date(b.createdAt ?? 0).getTime() - new Date(a.createdAt ?? 0).getTime())
        .slice(0, limit)
        .map(({ createdAt: _c, ...rest }) => rest);

      return NextResponse.json(activities);
    } catch (error) {
      if (error instanceof AppError) {
        return NextResponse.json({ message: error.message }, { status: error.statusCode });
      }
      securityLogger.error('Error fetching recent activity:', error);
      return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
    }
  });
}
