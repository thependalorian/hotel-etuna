/**
 * Partner — Rooms
 *
 * Purpose: View all rooms for the partner property.
 * Location: /app/partner/rooms/page.tsx
 */

import type { Metadata } from 'next';
import { getSessionWithTenantContext } from '@/lib/auth/tenant-context';
import { redirect } from 'next/navigation';
import { db, rooms, properties } from '@/lib/db';
import { eq, asc } from 'drizzle-orm';
import { BedDouble, Users, DollarSign, Hash } from 'lucide-react';

export const metadata: Metadata = { title: 'My Rooms' };
export const dynamic = 'force-dynamic';

export default async function PartnerRoomsPage() {
  const session = await getSessionWithTenantContext();
  if (!session?.user?.tenantId) redirect('/login');

  const tenantId = session.user.tenantId as string;

  const [property] = await db
    .select({ id: properties.id, name: properties.name })
    .from(properties)
    .where(eq(properties.tenantId, tenantId))
    .limit(1);

  if (!property) {
    return (
      <div className="space-y-4">
        <h2 className="text-2xl font-semibold text-base-content">Rooms</h2>
        <p className="text-base-content/60">No property found for your account.</p>
      </div>
    );
  }

  const roomList = await db
    .select({
      id: rooms.id,
      roomNumber: rooms.roomNumber,
      roomType: rooms.roomType,
      floor: rooms.floor,
      maxOccupancy: rooms.maxOccupancy,
      baseRate: rooms.baseRate,
      currency: rooms.currency,
      amenities: rooms.amenities,
      status: rooms.status,
      smokingAllowed: rooms.smokingAllowed,
      petFriendly: rooms.petFriendly,
    })
    .from(rooms)
    .where(eq(rooms.propertyId, property.id))
    .orderBy(asc(rooms.roomType), asc(rooms.roomNumber));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h2 className="text-2xl font-semibold text-base-content">Rooms</h2>
          <p className="text-sm text-base-content/60 mt-1">
            {property.name} · {roomList.length} room{roomList.length !== 1 ? 's' : ''}
          </p>
        </div>
        <a href="mailto:admin@hoteletuna.com?subject=Room update request" className="btn btn-outline btn-sm">
          Request changes
        </a>
      </div>

      {roomList.length === 0 ? (
        <div className="rounded-xl border border-base-300 bg-base-200 p-8 text-center text-base-content/60">
          No rooms found. Contact{' '}
          <a href="mailto:admin@hoteletuna.com" className="link link-primary">admin@hoteletuna.com</a>.
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="table table-sm w-full">
            <thead>
              <tr>
                <th>Room #</th>
                <th>Type</th>
                <th>Floor</th>
                <th>Max guests</th>
                <th>Base rate</th>
                <th>Features</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {roomList.map((room) => (
                <tr key={room.id} className="hover">
                  <td className="font-medium">
                    <span className="flex items-center gap-1">
                      <Hash className="w-3 h-3 text-base-content/40" />
                      {room.roomNumber}
                    </span>
                  </td>
                  <td className="capitalize">{room.roomType?.replace('_', ' ') ?? '—'}</td>
                  <td>{room.floor ?? '—'}</td>
                  <td>
                    <span className="flex items-center gap-1">
                      <Users className="w-3 h-3" /> {room.maxOccupancy ?? 2}
                    </span>
                  </td>
                  <td>
                    {room.baseRate ? (
                      <span className="text-success font-medium">
                        {room.currency ?? 'NAD'} {Number(room.baseRate).toFixed(2)}/night
                      </span>
                    ) : '—'}
                  </td>
                  <td>
                    <div className="flex gap-1 flex-wrap">
                      {room.petFriendly && <span className="badge badge-xs badge-neutral">Pet friendly</span>}
                      {!room.smokingAllowed && <span className="badge badge-xs badge-neutral">Non-smoking</span>}
                      {(room.amenities?.length ?? 0) > 0 && (
                        <span className="badge badge-xs badge-ghost">{room.amenities!.length} amenities</span>
                      )}
                    </div>
                  </td>
                  <td>
                    <span className={`badge badge-sm ${
                      room.status === 'available' ? 'badge-success' :
                      room.status === 'occupied' ? 'badge-info' :
                      room.status === 'maintenance' ? 'badge-warning' : 'badge-neutral'
                    }`}>
                      {room.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <p className="text-xs text-base-content/40">
        To update room details email{' '}
        <a href="mailto:admin@hoteletuna.com" className="link">admin@hoteletuna.com</a>.
      </p>
    </div>
  );
}
