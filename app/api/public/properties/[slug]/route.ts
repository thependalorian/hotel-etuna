import { NextResponse, NextRequest } from 'next/server';
import { db, properties } from '@/lib/db';
import { and, eq } from 'drizzle-orm';
import { securityLogger } from '@/lib/utils/security-logger';

export async function GET(request: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  try {
    const { slug } = await params;
    const [property] = await db
      .select({
        id: properties.id,
        tenantId: properties.tenantId,
        name: properties.name,
        slug: properties.slug,
        type: properties.type,
        description: properties.description,
        address: properties.address,
        city: properties.city,
        state: properties.state,
        country: properties.country,
        postalCode: properties.postalCode,
        amenities: properties.amenities,
        images: properties.images,
        checkInTime: properties.checkInTime,
        checkOutTime: properties.checkOutTime,
        status: properties.status,
        createdAt: properties.createdAt,
      })
      .from(properties)
      .where(and(eq(properties.slug, slug), eq(properties.status, 'active')))
      .limit(1);

    if (!property) {
      return NextResponse.json({ message: 'Property not found' }, { status: 404 });
    }

    return NextResponse.json(property, { status: 200 });
  } catch (error) {
    securityLogger.error('Error fetching property by slug:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}
