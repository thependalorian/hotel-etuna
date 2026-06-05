/**
 * Partner — My Property
 *
 * Purpose: View property details. Partners can review but must contact
 * Hotel Etuna admin for updates.
 * Location: /app/partner/my-property/page.tsx
 */

import type { Metadata } from 'next';
import { getSessionWithTenantContext } from '@/lib/auth/tenant-context';
import { redirect } from 'next/navigation';
import { db, properties } from '@/lib/db';
import { eq } from 'drizzle-orm';
import { MapPin, Phone, Mail, Star, Home, Info } from 'lucide-react';

export const metadata: Metadata = { title: 'My Property' };
export const dynamic = 'force-dynamic';

export default async function PartnerMyPropertyPage() {
  const session = await getSessionWithTenantContext();
  if (!session?.user?.tenantId) redirect('/login');

  const tenantId = session.user.tenantId as string;

  const [property] = await db
    .select()
    .from(properties)
    .where(eq(properties.tenantId, tenantId))
    .limit(1);

  if (!property) {
    return (
      <div className="space-y-4">
        <h2 className="text-2xl font-semibold text-base-content">My Property</h2>
        <div className="rounded-xl border border-base-300 bg-base-200 p-8 text-center text-base-content/60">
          No property found for your account. Contact{' '}
          <a href="mailto:admin@hoteletuna.com" className="link link-primary">admin@hoteletuna.com</a>.
        </div>
      </div>
    );
  }

  const stars = property.starRating ?? 0;

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h2 className="text-2xl font-semibold text-base-content">{property.name}</h2>
          <div className="flex items-center gap-1 mt-1">
            {Array.from({ length: stars }).map((_, i) => (
              <Star key={i} className="w-4 h-4 fill-warning text-warning" />
            ))}
            {stars > 0 && <span className="text-sm text-base-content/60 ml-1">{stars}-star</span>}
          </div>
        </div>
        <a
          href="mailto:admin@hoteletuna.com?subject=Property update request"
          className="btn btn-outline btn-sm"
        >
          Request an update
        </a>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Location */}
        <div className="rounded-xl border border-base-300 bg-base-100 p-5 space-y-3">
          <h3 className="font-semibold text-base-content flex items-center gap-2">
            <MapPin className="w-4 h-4 text-primary" /> Location
          </h3>
          <div className="text-sm text-base-content/70 space-y-1">
            {property.address && <p>{property.address}</p>}
            {(property.city || property.state) && (
              <p>{[property.city, property.state].filter(Boolean).join(', ')}</p>
            )}
            {property.country && <p>{property.country}</p>}
            {property.postalCode && <p>Postal: {property.postalCode}</p>}
            {!property.address && !property.city && (
              <p className="text-base-content/40 italic">No address on file</p>
            )}
          </div>
        </div>

        {/* Property details */}
        <div className="rounded-xl border border-base-300 bg-base-100 p-5 space-y-3">
          <h3 className="font-semibold text-base-content flex items-center gap-2">
            <Home className="w-4 h-4 text-primary" /> Details
          </h3>
          <dl className="text-sm space-y-2">
            <div className="flex justify-between">
              <dt className="text-base-content/60">Type</dt>
              <dd className="font-medium capitalize">{property.type ?? '—'}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-base-content/60">Rooms</dt>
              <dd className="font-medium">{property.roomCount ?? '—'}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-base-content/60">Check-in</dt>
              <dd className="font-medium">14:00</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-base-content/60">Check-out</dt>
              <dd className="font-medium">11:00</dd>
            </div>
          </dl>
        </div>
      </div>

      {/* Description */}
      {property.description && (
        <div className="rounded-xl border border-base-300 bg-base-100 p-5">
          <h3 className="font-semibold text-base-content flex items-center gap-2 mb-3">
            <Info className="w-4 h-4 text-primary" /> Description
          </h3>
          <p className="text-sm text-base-content/70 leading-relaxed">{property.description}</p>
        </div>
      )}

      {/* Update note */}
      <div className="rounded-xl border border-warning/30 bg-warning/5 p-4 text-sm text-base-content/70">
        <strong>Need to update your listing?</strong> Email{' '}
        <a href="mailto:admin@hoteletuna.com" className="link">admin@hoteletuna.com</a>{' '}
        with your requested changes. Partner self-service editing is coming in the next release.
      </div>
    </div>
  );
}
