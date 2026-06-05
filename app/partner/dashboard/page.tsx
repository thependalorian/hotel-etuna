/**
 * Partner Dashboard
 *
 * Purpose: Overview of property performance, upcoming arrivals, and pipeline.
 * Location: /app/partner/dashboard/page.tsx
 */

import type { Metadata } from 'next';
import Link from 'next/link';
import { getSessionWithTenantContext } from '@/lib/auth/tenant-context';
import { redirect } from 'next/navigation';
import { db, bookings, properties, rooms } from '@/lib/db';
import { eq, and, gte, count } from 'drizzle-orm';

export const metadata: Metadata = { title: 'Partner Dashboard' };

export const dynamic = 'force-dynamic';

export default async function PartnerDashboardPage() {
  const session = await getSessionWithTenantContext();
  if (!session?.user?.tenantId) redirect('/login');

  const tenantId = session.user.tenantId as string;
  const today = new Date().toISOString().split('T')[0];

  const [propertyList, upcomingArrivals, totalRooms] = await Promise.all([
    db.select({ id: properties.id, name: properties.name, city: properties.city })
      .from(properties)
      .where(eq(properties.tenantId, tenantId))
      .limit(1),
    db.select({ id: bookings.id }).from(bookings)
      .where(and(eq(bookings.tenantId, tenantId), gte(bookings.checkInDate, today)))
      .limit(100),
    db.select({ n: count() }).from(rooms)
      .innerJoin(properties, eq(rooms.propertyId, properties.id))
      .where(eq(properties.tenantId, tenantId)),
  ]);

  const property = propertyList[0];
  const arrivalsCount = upcomingArrivals.length;
  const roomCount = totalRooms[0]?.n ?? 0;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold text-base-content">
          {property?.name ?? 'My Property'}
        </h2>
        <p className="text-base-content/60 text-sm mt-1">{property?.city ?? 'Windhoek, Namibia'}</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="stat bg-base-200 rounded-xl">
          <div className="stat-title">Upcoming arrivals</div>
          <div className="stat-value text-primary">{arrivalsCount}</div>
          <div className="stat-desc">from today onwards</div>
        </div>
        <div className="stat bg-base-200 rounded-xl">
          <div className="stat-title">Rooms</div>
          <div className="stat-value">{roomCount}</div>
          <div className="stat-desc">in your property</div>
        </div>
        <div className="stat bg-base-200 rounded-xl">
          <div className="stat-title">Commission</div>
          <div className="stat-value text-success">10%</div>
          <div className="stat-desc">on all bookings</div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Link href="/partner/bookings" className="card bg-base-200 hover:bg-base-300 transition-colors p-5">
          <h3 className="font-semibold text-base-content mb-1">Bookings</h3>
          <p className="text-sm text-base-content/60">View and manage your reservations</p>
        </Link>
        <Link href="/partner/my-property" className="card bg-base-200 hover:bg-base-300 transition-colors p-5">
          <h3 className="font-semibold text-base-content mb-1">My property</h3>
          <p className="text-sm text-base-content/60">Update photos, description and amenities</p>
        </Link>
        <Link href="/partner/rooms" className="card bg-base-200 hover:bg-base-300 transition-colors p-5">
          <h3 className="font-semibold text-base-content mb-1">Rooms</h3>
          <p className="text-sm text-base-content/60">Manage room types and availability</p>
        </Link>
        <Link href="/partner/rates" className="card bg-base-200 hover:bg-base-300 transition-colors p-5">
          <h3 className="font-semibold text-base-content mb-1">Rates</h3>
          <p className="text-sm text-base-content/60">Set seasonal pricing and rate plans</p>
        </Link>
      </div>
    </div>
  );
}
