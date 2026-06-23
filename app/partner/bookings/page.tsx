/**
 * Partner Bookings
 *
 * Purpose: List all bookings for this partner tenant.
 * Location: /app/partner/bookings/page.tsx
 */

import type { Metadata } from 'next';
import { getSessionWithTenantContext } from '@/lib/auth/tenant-context';
import { redirect } from 'next/navigation';
import { db, bookings, guests } from '@/lib/db';
import { desc, eq } from 'drizzle-orm';

export const metadata: Metadata = { title: 'My Bookings' };
export const dynamic = 'force-dynamic';

const STATUS_BADGE: Record<string, string> = {
  confirmed: 'badge-success',
  pending: 'badge-warning',
  checked_in: 'badge-info',
  checked_out: 'badge-neutral',
  cancelled: 'badge-error',
  no_show: 'badge-error',
};

export default async function PartnerBookingsPage() {
  const session = await getSessionWithTenantContext();
  if (!session?.user?.tenantId) redirect('/login');

  const tenantId = session.user.tenantId as string;

  const rows = await db
    .select({
      id: bookings.id,
      bookingReference: bookings.bookingReference,
      checkInDate: bookings.checkInDate,
      checkOutDate: bookings.checkOutDate,
      status: bookings.status,
      totalAmount: bookings.totalAmount,
      currency: bookings.currency,
      commissionAmount: bookings.commissionAmount,
      guestEmail: guests.email,
      guestFirstName: guests.firstName,
      guestLastName: guests.lastName,
    })
    .from(bookings)
    .leftJoin(guests, eq(bookings.guestId, guests.id))
    .where(eq(bookings.tenantId, tenantId))
    .orderBy(desc(bookings.checkInDate))
    .limit(100);

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-semibold text-base-content">Bookings</h2>
      <p className="text-base-content/60 text-sm">{rows.length} reservation{rows.length !== 1 ? 's' : ''}</p>

      {rows.length === 0 ? (
        <div className="rounded-etuna-card border border-base-300 bg-base-200 p-8 text-center text-base-content/60">
          No bookings yet. Your reservations will appear here once guests book through hoteletuna.com.
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="table table-sm w-full">
            <thead>
              <tr>
                <th>Ref</th>
                <th>Guest</th>
                <th>Check-in</th>
                <th>Check-out</th>
                <th>Status</th>
                <th className="text-right">Total</th>
                <th className="text-right">Your commission</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id} className="hover">
                  <td className="font-mono text-xs">{r.bookingReference}</td>
                  <td>{r.guestFirstName ?? ''} {r.guestLastName ?? r.guestEmail ?? '—'}</td>
                  <td>{r.checkInDate}</td>
                  <td>{r.checkOutDate}</td>
                  <td>
                    <span className={`badge badge-sm ${STATUS_BADGE[r.status ?? ''] ?? 'badge-neutral'}`}>
                      {r.status?.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="text-right">
                    {r.currency} {Number(r.totalAmount ?? 0).toFixed(2)}
                  </td>
                  <td className="text-right text-success font-medium">
                    {r.currency} {Number(r.commissionAmount ?? 0).toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
