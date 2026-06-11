/**
 * Partner Public Profile API
 *
 * Purpose: Return public partner property profile by slug.
 * Location: /app/api/partners/[slug]/route.ts
 */

import { NextRequest, NextResponse } from 'next/server';
import { db, properties, rooms, tenants } from '@/lib/db';
import { and, asc, eq } from 'drizzle-orm';
import { securityLogger } from '@/lib/utils/security-logger';

interface Params {
  params: Promise<{ slug: string }>;
}

export async function GET(_req: NextRequest, { params }: Params) {
  try {
    const { slug } = await params;

    const propertyRows = await db
      .select({
        id: properties.id,
        name: properties.name,
        slug: properties.slug,
        description: properties.description,
        city: properties.city,
        state: properties.state,
        country: properties.country,
        address: properties.address,
        starRating: properties.starRating,
        currency: properties.currency,
        amenities: properties.amenities,
        images: properties.images,
        checkInTime: properties.checkInTime,
        checkOutTime: properties.checkOutTime,
        propertyType: properties.type,
        tenantId: properties.tenantId,
        tenantName: tenants.name,
        tenantType: tenants.type,
      })
      .from(properties)
      .innerJoin(tenants, eq(properties.tenantId, tenants.id))
      .where(and(eq(properties.slug, slug), eq(properties.status, 'active')))
      .limit(1);

    const row = propertyRows[0];
    if (!row || row.tenantType !== 'partner') {
      return NextResponse.json({ error: 'Partner not found' }, { status: 404 });
    }

    const roomRows = await db
      .select({
        id: rooms.id,
        roomNumber: rooms.roomNumber,
        roomType: rooms.roomType,
        maxOccupancy: rooms.maxOccupancy,
        baseRate: rooms.baseRate,
        currency: rooms.currency,
        amenities: rooms.amenities,
        images: rooms.images,
        status: rooms.status,
      })
      .from(rooms)
      .where(eq(rooms.propertyId, row.id))
      .orderBy(asc(rooms.roomNumber));

    return NextResponse.json(
      {
        property: {
          id: row.id,
          name: row.name,
          slug: row.slug,
          description: row.description ?? '',
          address: {
            street: row.address ?? '',
            city: row.city ?? '',
            state: row.state ?? '',
            country: row.country ?? 'Namibia',
            coordinates: null,
          },
          contact: {
            phone: '',
            email: '',
            website: null,
          },
          checkInTime: row.checkInTime,
          checkOutTime: row.checkOutTime,
          currency: row.currency ?? 'NAD',
          images: row.images ?? [],
          amenities: row.amenities ?? [],
          type: row.propertyType,
          tenantId: row.tenantId,
          tenantName: row.tenantName,
          starRating: row.starRating ?? 0,
        },
        rooms: roomRows.map((room) => ({
          id: room.id,
          name: room.roomType,
          description: `${room.roomType} (${room.roomNumber})`,
          type: room.roomType,
          capacity: room.maxOccupancy ?? 2,
          pricePerNight: room.baseRate ? Number(room.baseRate) : 0,
          currency: room.currency ?? 'NAD',
          images: room.images ?? [],
          amenities: room.amenities ?? [],
          available: (room.status ?? 'available').toLowerCase() === 'available',
          quantityAvailable: (room.status ?? 'available').toLowerCase() === 'available' ? 1 : 0,
        })),
      },
      {
        headers: {
          'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=7200',
        },
      }
    );
  } catch (error) {
    securityLogger.error('Failed to load partner profile:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
