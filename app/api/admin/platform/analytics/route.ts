/**
 * Platform Admin — aggregate analytics (Drizzle, server-only)
 *
 * Purpose: Replace client-side Supabase queries; safe for platform admins only.
 * Location: app/api/admin/platform/analytics/route.ts
 *
 * Query: ?range=7d|30d|90d|12m
 * Response: { revenue, bookings, users, properties, monthlyData, topProperties, bookingsByStatus }
 */

import { NextRequest, NextResponse } from 'next/server';
import { db, bookings, users, properties } from '@/lib/db';
import { gte, ne, and, inArray, count } from 'drizzle-orm';
import { withPlatformAdminAuth } from '@/lib/auth/with-platform-admin-auth';
import { securityLogger } from '@/lib/utils/security-logger';

export const dynamic = 'force-dynamic';

const RANGE_DAYS: Record<string, number> = {
  '7d': 7,
  '30d': 30,
  '90d': 90,
  '12m': 365,
};

export async function GET(request: NextRequest) {
  return withPlatformAdminAuth(request, async (req) => {
  try {
    const { searchParams } = new URL(req!.url);
    const range = searchParams.get('range') ?? '30d';
    const days = RANGE_DAYS[range] ?? 30;

    const now = new Date();
    const startDate = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);

    const [bookingRows, totalUsersRow, newUsersRow, totalPropertiesRow] = await Promise.all([
      db
        .select({
          id: bookings.id,
          status: bookings.status,
          totalAmount: bookings.totalAmount,
          createdAt: bookings.createdAt,
          propertyId: bookings.propertyId,
        })
        .from(bookings)
        .where(gte(bookings.createdAt, startDate)),
      db
        .select({ n: count() })
        .from(users)
        .where(ne(users.role, 'super-admin'))
        .then((r) => Number(r[0]?.n ?? 0)),
      db
        .select({ n: count() })
        .from(users)
        .where(and(ne(users.role, 'super-admin'), gte(users.createdAt, startDate)))
        .then((r) => Number(r[0]?.n ?? 0)),
      db
        .select({ n: count() })
        .from(properties)
        .then((r) => Number(r[0]?.n ?? 0)),
    ]);

    const totalRevenue = bookingRows.reduce(
      (sum, b) => sum + Number(b.totalAmount ?? 0),
      0,
    );

    const bookingsByStatus = bookingRows.reduce(
      (acc, b) => {
        const s = b.status ?? 'unknown';
        acc[s] = (acc[s] ?? 0) + 1;
        return acc;
      },
      {} as Record<string, number>,
    );

    const byMonth = new Map<
      string,
      { revenue: number; bookings: number; users: number }
    >();
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = d.toLocaleDateString('en-NA', { month: 'short', year: '2-digit' });
      byMonth.set(key, { revenue: 0, bookings: 0, users: 0 });
    }
    for (const b of bookingRows) {
      if (!b.createdAt) continue;
      const d = new Date(b.createdAt);
      const key = d.toLocaleDateString('en-NA', { month: 'short', year: '2-digit' });
      const bucket = byMonth.get(key);
      if (bucket) {
        bucket.revenue += Number(b.totalAmount ?? 0);
        bucket.bookings += 1;
      }
    }

    const monthlyData = Array.from(byMonth.entries()).map(([month, v]) => ({
      month,
      revenue: v.revenue,
      bookings: v.bookings,
      users: v.users,
    }));

    const perProperty = new Map<string, { bookings: number; revenue: number }>();
    for (const b of bookingRows) {
      if (!b.propertyId) continue;
      const cur = perProperty.get(b.propertyId) ?? { bookings: 0, revenue: 0 };
      cur.bookings += 1;
      cur.revenue += Number(b.totalAmount ?? 0);
      perProperty.set(b.propertyId, cur);
    }
    const topIds = [...perProperty.entries()]
      .sort((a, b) => b[1].bookings - a[1].bookings)
      .slice(0, 5)
      .map(([id]) => id);

    let topProperties: { name: string; bookings: number; revenue: number }[] = [];
    if (topIds.length > 0) {
      const props = await db
        .select({ id: properties.id, name: properties.name })
        .from(properties)
        .where(inArray(properties.id, topIds));
      const nameById = new Map(props.map((p) => [p.id, p.name]));
      topProperties = topIds.map((id) => {
        const agg = perProperty.get(id)!;
        return {
          name: nameById.get(id) ?? 'Property',
          bookings: agg.bookings,
          revenue: agg.revenue,
        };
      });
    }

    return NextResponse.json({
      revenue: {
        total: totalRevenue,
        monthly: days > 0 ? totalRevenue / (days / 30) : totalRevenue,
        growth: 0,
      },
      bookings: {
        total: bookingRows.length,
        active: bookingsByStatus['confirmed'] ?? 0,
        completed: bookingsByStatus['checked_out'] ?? 0,
        cancelled: bookingsByStatus['cancelled'] ?? 0,
      },
      users: {
        total: totalUsersRow,
        newThisMonth: newUsersRow,
        growth: 0,
      },
      properties: {
        total: totalPropertiesRow,
        occupancy: 0,
      },
      monthlyData,
      topProperties,
      bookingsByStatus: Object.entries(bookingsByStatus).map(([status, count]) => ({
        status,
        count,
      })),
    });
  } catch (err) {
    securityLogger.error('[Platform Admin Analytics]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
  });
}
