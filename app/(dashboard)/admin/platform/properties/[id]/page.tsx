/**
 * Platform Admin - Property detail
 *
 * Purpose: Single property view for platform admins
 * Location: app/(dashboard)/admin/platform/properties/[id]/page.tsx
 */

import React from 'react';
import Link from 'next/link';
import { redirect, notFound } from 'next/navigation';
import { getCurrentPlatformAdmin, isPlatformAdmin } from '@/lib/auth/platform-admin';
import { db, properties, tenants, rooms } from '@/lib/db';
import { eq, count } from 'drizzle-orm';
import { ArrowLeft, MapPin } from 'lucide-react';
import PropertyDetails from '@/components/features/admin/platform/PropertyDetails';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function PlatformPropertyDetailPage({ params }: PageProps) {
  const admin = await getCurrentPlatformAdmin();
  if (!admin || !isPlatformAdmin(admin)) {
    redirect('/unauthorized');
  }

  const { id } = await params;

  const propRows = await db
    .select({
      property: properties,
      tenantName: tenants.name,
    })
    .from(properties)
    .leftJoin(tenants, eq(properties.tenantId, tenants.id))
    .where(eq(properties.id, id))
    .limit(1);

  const row = propRows[0];
  if (!row) {
    notFound();
  }

  const p = row.property;

  const [roomRow] = await db
    .select({ count: count() })
    .from(rooms)
    .where(eq(rooms.propertyId, id));

  const roomCount = Number(roomRow?.count ?? 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link
          href="/admin/platform/properties"
          className="btn btn-ghost btn-sm btn-square min-h-[44px]"
          title="Back to properties"
        >
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div>
          <h1 className="buffr-page-title mb-1">{p.name}</h1>
          <p className="text-base-content/70 flex items-center gap-2">
            <MapPin className="w-4 h-4" />
            {[p.address, p.city, p.country].filter(Boolean).join(', ') || '—'}
          </p>
        </div>
      </div>

      <PropertyDetails
        property={{
          slug: p.slug,
          description: p.description,
          type: p.type,
          status: p.status,
          currency: p.currency,
          timezone: p.timezone,
          hasRestaurantFeatures: p.hasRestaurantFeatures,
          createdAt: p.createdAt,
        }}
        tenantName={row.tenantName}
        roomCount={roomCount}
      />
    </div>
  );
}
