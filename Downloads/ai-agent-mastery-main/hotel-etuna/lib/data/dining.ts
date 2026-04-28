/**
 * Shared Data Access Layer — Dining/Restaurant
 * 
 * Purpose: Single source of truth for restaurant & menu queries
 * Location: lib/data/dining.ts
 * 
 * @version 1.0.0
 * @since April 28, 2026
 */

import { db } from '@/lib/db';
import { restaurants, cmsMenuItems } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { cache } from 'react';

const DEFAULT_PROPERTY_ID = process.env.DEFAULT_PROPERTY_ID!;

/**
 * Get Hotel Etuna restaurant details
 */
export const getHubRestaurant = cache(async () => {
  try {
    const [restaurant] = await db
      .select()
      .from(restaurants)
      .where(eq(restaurants.propertyId, DEFAULT_PROPERTY_ID))
      .limit(1);

    return restaurant || null;
  } catch (error) {
    console.error('[getHubRestaurant] Error:', error);
    return null;
  }
});

/**
 * Get available menu items
 */
export const getMenuItems = cache(async (limit?: number) => {
  try {
    let query = db
      .select()
      .from(cmsMenuItems)
      .where(
        and(
          eq(cmsMenuItems.propertyId, DEFAULT_PROPERTY_ID),
          eq(cmsMenuItems.isAvailable, true)
        )
      )
      .orderBy(cmsMenuItems.category, cmsMenuItems.name);

    if (limit) {
      query = query.limit(limit) as typeof query;
    }

    const items = await query;
    return items;
  } catch (error) {
    console.error('[getMenuItems] Error:', error);
    return [];
  }
});

/**
 * Type exports
 */
export type Restaurant = Awaited<ReturnType<typeof getHubRestaurant>>;
export type MenuItem = Awaited<ReturnType<typeof getMenuItems>>[0];
