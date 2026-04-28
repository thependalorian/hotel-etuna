/**
 * Partner Public Profile API
 *
 * Purpose: Return public partner property profile by slug.
 * Location: /app/api/partners/[slug]/route.ts
 */

import { NextRequest, NextResponse } from 'next/server';
import { db, properties, tenants } from '@/lib/db';
import { and, eq } from 'drizzle-orm';

interface Params {
  params: Promise<{ slug: string }>;
}

export async function GET(_req: NextRequest, { params }: Params) {
  try {
    const { slug } = await params;

    const rows = await db
      .select({
        id: properties.id,
        name: properties.name,
        slug: properties.slug,
        description: properties.description,
        city: properties.city,
        country: properties.country,
        address: properties.address,
        amenities: properties.amenities,
        images: properties.images,
        checkInTime: properties.checkInTime,
        checkOutTime: properties.checkOutTime,
        tenantId: properties.tenantId,
        tenantType: tenants.type,
      })
      .from(properties)
      .innerJoin(tenants, eq(properties.tenantId, tenants.id))
      .where(and(eq(properties.slug, slug), eq(properties.status, 'active')))
      .limit(1);

    const row = rows[0];
    if (!row || row.tenantType !== 'partner') {
      return NextResponse.json({ error: 'Partner not found' }, { status: 404 });
    }

    return NextResponse.json({
      data: {
        id: row.id,
        name: row.name,
        slug: row.slug,
        description: row.description,
        city: row.city,
        country: row.country,
        address: row.address,
        amenities: row.amenities ?? [],
        images: row.images ?? [],
        checkInTime: row.checkInTime,
        checkOutTime: row.checkOutTime,
        tenantId: row.tenantId,
      },
    });
  } catch (error) {
    console.error('Failed to load partner profile:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
