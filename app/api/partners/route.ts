/**
 * Partners List API Route
 *
 * Purpose: Fetch all active partner properties for directory page.
 * Location: app/api/partners/route.ts
 */

import { NextResponse } from 'next/server';
import { db, properties, rooms, tenants } from '@/lib/db';
import { and, asc, eq, inArray } from 'drizzle-orm';
import { securityLogger } from '@/lib/utils/security-logger';

export async function GET() {
  try {
    const rows = await db
      .select({
        id: properties.id,
        name: properties.name,
        slug: properties.slug,
        description: properties.description,
        city: properties.city,
        state: properties.state,
        country: properties.country,
        starRating: properties.starRating,
        images: properties.images,
        amenities: properties.amenities,
        type: properties.type,
        tenantId: tenants.id,
        tenantName: tenants.name,
      })
      .from(properties)
      .innerJoin(tenants, eq(properties.tenantId, tenants.id))
      .where(and(eq(tenants.type, 'partner'), eq(properties.status, 'active')))
      .orderBy(asc(properties.name));

    const propertyIds = rows.map((row) => row.id);
    const roomCountRows = propertyIds.length
      ? await db
          .select({ propertyId: rooms.propertyId })
          .from(rooms)
          .where(inArray(rooms.propertyId, propertyIds))
      : [];
    const roomCountMap = roomCountRows.reduce<Record<string, number>>((acc, row) => {
      const id = row.propertyId ?? '';
      if (!id) return acc;
      acc[id] = (acc[id] ?? 0) + 1;
      return acc;
    }, {});

    const partners = rows.map((row) => ({
      id: row.id,
      name: row.name,
      slug: row.slug,
      description: row.description ?? '',
      location: {
        city: row.city ?? '',
        state: row.state ?? '',
        country: row.country ?? 'Namibia',
      },
      starRating: row.starRating ?? 0,
      images: row.images ?? [],
      amenities: row.amenities ?? [],
      type: row.type,
      roomCount: roomCountMap[row.id] ?? 0,
      tenantId: row.tenantId,
      tenantName: row.tenantName,
    }));

    return NextResponse.json(
      { partners },
      {
        headers: {
          'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=7200',
        },
      }
    );
  } catch (error) {
    securityLogger.error('[API] Partners list error:', error);
    return NextResponse.json({ error: 'Failed to fetch partners' }, { status: 500 });
  }
}
