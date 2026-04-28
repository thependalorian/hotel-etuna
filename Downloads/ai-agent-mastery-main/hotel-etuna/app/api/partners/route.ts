/**
 * Partners List API Route
 *
 * Purpose: Fetch all active partner properties for directory page.
 * Location: app/api/partners/route.ts
 */

import { NextResponse } from 'next/server';
import { db, properties, tenants } from '@/lib/db';
import { and, asc, eq } from 'drizzle-orm';

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
    console.error('[API] Partners list error:', error);
    return NextResponse.json({ error: 'Failed to fetch partners' }, { status: 500 });
  }
}
