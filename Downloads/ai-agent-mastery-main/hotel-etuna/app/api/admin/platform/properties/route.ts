/**
 * Platform Admin - Properties API
 *
 * Purpose: List properties across tenants for platform admin (Drizzle)
 * Location: app/api/admin/platform/properties/route.ts
 */

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { properties, tenants } from '@/lib/db';
import { eq, desc } from 'drizzle-orm';
import { getCurrentPlatformAdmin, isPlatformAdmin } from '@/lib/auth/platform-admin';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentPlatformAdmin();
    if (!user || !isPlatformAdmin(user)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const rows = await db
      .select({
        property: properties,
        tenantName: tenants.name,
      })
      .from(properties)
      .leftJoin(tenants, eq(properties.tenantId, tenants.id))
      .orderBy(desc(properties.createdAt));

    return NextResponse.json({
      properties: rows.map(({ property: p, tenantName }) => ({
        id: p.id,
        tenantId: p.tenantId,
        tenantName: tenantName ?? null,
        name: p.name,
        slug: p.slug,
        type: p.type,
        status: p.status,
        roomCount: p.roomCount,
        city: p.city,
        country: p.country,
        createdAt: p.createdAt,
      })),
    });
  } catch (err) {
    console.error('[Platform Admin Properties]', err);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
