/**
 * Partner — Rates
 *
 * Purpose: View current room rate schedules for the partner property.
 * Location: /app/partner/rates/page.tsx
 */

import type { Metadata } from 'next';
import { getSessionWithTenantContext } from '@/lib/auth/tenant-context';
import { redirect } from 'next/navigation';
import { db, rooms, properties, roomRates } from '@/lib/db';
import { eq, asc } from 'drizzle-orm';

export const metadata: Metadata = { title: 'Rates' };
export const dynamic = 'force-dynamic';

export default async function PartnerRatesPage() {
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
        <h2 className="text-2xl font-semibold text-base-content">Rates</h2>
        <p className="text-base-content/60">No property found.</p>
      </div>
    );
  }

  const roomsWithRates = await db
    .select({
      roomId: rooms.id,
      roomNumber: rooms.roomNumber,
      roomType: rooms.roomType,
      baseRate: rooms.baseRate,
      currency: rooms.currency,
      rateId: roomRates.id,
      rateName: roomRates.rateName,
      rateAmount: roomRates.rateAmount,
      validFrom: roomRates.validFrom,
      validTo: roomRates.validTo,
      minStay: roomRates.minStayNights,
      isDefault: roomRates.isDefault,
    })
    .from(rooms)
    .leftJoin(roomRates, eq(roomRates.roomId, rooms.id))
    .where(eq(rooms.propertyId, property.id))
    .orderBy(asc(rooms.roomNumber), asc(roomRates.validFrom));

  // Group by room
  const byRoom = new Map<string, typeof roomsWithRates>();
  for (const row of roomsWithRates) {
    if (!byRoom.has(row.roomId)) byRoom.set(row.roomId, []);
    byRoom.get(row.roomId)!.push(row);
  }

  const today = new Date().toISOString().split('T')[0];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h2 className="text-2xl font-semibold text-base-content">Rates</h2>
          <p className="text-sm text-base-content/60 mt-1">{property.name}</p>
        </div>
        <a href="mailto:admin@hoteletuna.com?subject=Rate update request" className="btn btn-outline btn-sm">
          Request rate change
        </a>
      </div>

      {byRoom.size === 0 ? (
        <div className="rounded-xl border border-base-300 bg-base-200 p-8 text-center text-base-content/60">
          No rate schedules on file. Contact{' '}
          <a href="mailto:admin@hoteletuna.com" className="link link-primary">admin@hoteletuna.com</a>.
        </div>
      ) : (
        <div className="space-y-4">
          {Array.from(byRoom.entries()).map(([, rows]) => {
            const first = rows[0];
            const rates = rows.filter((r) => r.rateId);
            return (
              <div key={first.roomId} className="rounded-xl border border-base-300 bg-base-100 p-5">
                <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
                  <div>
                    <h3 className="font-semibold text-base-content">
                      Room #{first.roomNumber} · <span className="capitalize font-normal">{first.roomType?.replace('_', ' ')}</span>
                    </h3>
                  </div>
                  {first.baseRate && (
                    <div className="text-sm font-medium">
                      Base: <span className="text-success">{first.currency ?? 'NAD'} {Number(first.baseRate).toFixed(2)}/night</span>
                    </div>
                  )}
                </div>

                {rates.length === 0 ? (
                  <p className="text-sm text-base-content/50 italic">No seasonal rates — base rate applies.</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="table table-sm w-full">
                      <thead>
                        <tr>
                          <th>Rate name</th>
                          <th>Amount / night</th>
                          <th>Valid from</th>
                          <th>Valid to</th>
                          <th>Min stay</th>
                          <th>Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {rates.map((r) => {
                          const isActive = r.validFrom! <= today && r.validTo! >= today;
                          return (
                            <tr key={r.rateId} className="hover">
                              <td>
                                {r.rateName}
                                {r.isDefault && <span className="badge badge-xs badge-neutral ml-1">default</span>}
                              </td>
                              <td className="font-medium text-success">
                                {first.currency ?? 'NAD'} {Number(r.rateAmount).toFixed(2)}
                              </td>
                              <td>{r.validFrom}</td>
                              <td>{r.validTo}</td>
                              <td>{r.minStay ?? 1}n</td>
                              <td>
                                <span className={`badge badge-xs ${isActive ? 'badge-success' : 'badge-neutral'}`}>
                                  {isActive ? 'Active' : 'Inactive'}
                                </span>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      <p className="text-xs text-base-content/40">
        Rate changes require Hotel Etuna approval. Email{' '}
        <a href="mailto:admin@hoteletuna.com" className="link">admin@hoteletuna.com</a> to request updates.
      </p>
    </div>
  );
}
