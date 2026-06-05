import { NextResponse, NextRequest } from 'next/server';
import { PropertyService } from '@/lib/services/property/PropertyService';
import { getAuthenticatedUser } from '@/lib/utils/api-helpers';
import { db, restaurants } from '@/lib/db';
import { eq } from 'drizzle-orm';
import { securityLogger } from '@/lib/utils/security-logger.client';

const propertyService = new PropertyService();

export async function GET(request: NextRequest) {
  const user = await getAuthenticatedUser(request);

  if (!user || !user.tenantId) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const propertyId = searchParams.get('propertyId');

  if (!propertyId) {
    return NextResponse.json({ message: 'Missing propertyId parameter' }, { status: 400 });
  }

  try {
    const property = await propertyService.getPropertyById(propertyId, user.tenantId);
    if (!property) {
      return NextResponse.json({ message: 'Property not found or does not belong to tenant' }, { status: 404 });
    }

    const rows = await db
      .select()
      .from(restaurants)
      .where(eq(restaurants.propertyId, propertyId))
      .limit(1);
    const restaurant = rows[0];

    if (!restaurant) {
      return NextResponse.json({ message: 'Restaurant not found for this property' }, { status: 404 });
    }

    return NextResponse.json({
      id: restaurant.id,
      propertyId: restaurant.propertyId,
      name: restaurant.name,
      cuisine: restaurant.cuisineType || 'International',
      description: restaurant.description || '',
      openingHours: restaurant.openingHours || {},
      capacity: restaurant.capacity,
      contactPhone: restaurant.contactPhone,
      contactEmail: restaurant.contactEmail,
      images: restaurant.images || [],
      status: restaurant.status,
      createdAt: restaurant.createdAt?.toISOString?.() ?? new Date().toISOString(),
      updatedAt: restaurant.updatedAt?.toISOString?.() ?? new Date().toISOString(),
    }, { status: 200 });
  } catch (error) {
    securityLogger.error('Error fetching restaurant details:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}
