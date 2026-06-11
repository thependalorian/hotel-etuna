import { NextResponse, NextRequest } from 'next/server';
import {
  db,
  cmsMenuItems,
  menuCategories,
  properties,
  restaurants,
} from '@/lib/db';
import { and, asc, eq } from 'drizzle-orm';
import { securityLogger } from '@/lib/utils/security-logger';

export async function GET(_request: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  try {
    const { slug } = await params;
    const [property] = await db
      .select()
      .from(properties)
      .where(and(eq(properties.slug, slug), eq(properties.status, 'active')))
      .limit(1);

    if (!property) {
      return NextResponse.json({ message: 'Property not found' }, { status: 404 });
    }

    const [restaurant] = await db
      .select()
      .from(restaurants)
      .where(and(eq(restaurants.propertyId, property.id), eq(restaurants.status, 'active')))
      .limit(1);

    if (!restaurant) {
      return NextResponse.json({ message: 'Restaurant not found for this property' }, { status: 404 });
    }

    const [categories, items] = await Promise.all([
      db
        .select()
        .from(menuCategories)
        .where(and(eq(menuCategories.restaurantId, restaurant.id), eq(menuCategories.isActive, true)))
        .orderBy(asc(menuCategories.displayOrder)),
      db
        .select()
        .from(cmsMenuItems)
        .where(and(eq(cmsMenuItems.restaurantId, restaurant.id), eq(cmsMenuItems.isAvailable, true)))
        .orderBy(asc(cmsMenuItems.displayOrder)),
    ]);

    const menu = categories.map(category => ({
      ...category,
      items: items.filter(item => item.categoryId === category.id),
    }));

    return NextResponse.json(menu, { status: 200 });
  } catch (error) {
    securityLogger.error('Error fetching public menu:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}
