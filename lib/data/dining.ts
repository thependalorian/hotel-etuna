/**
 * Shared Data Access Layer — Dining/Restaurant
 * 
 * Purpose: Single source of truth for restaurant & menu queries
 * Location: lib/data/dining.ts
 * 
 * @version 1.1.0
 * @since April 28, 2026
 */

import { db } from '@/lib/db';
import { restaurants, cmsMenuItems, menuCategories } from '@/lib/db/schema';
import { eq, and, inArray, asc } from 'drizzle-orm';
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
 * Get available menu items (simple version)
 */
export const getMenuItems = cache(async (limit?: number) => {
  try {
    const restaurant = await getHubRestaurant();
    if (!restaurant) {
      return [];
    }

    const base = db
      .select()
      .from(cmsMenuItems)
      .where(
        and(
          eq(cmsMenuItems.restaurantId, restaurant.id),
          eq(cmsMenuItems.isAvailable, true),
        ),
      )
      .orderBy(asc(cmsMenuItems.displayOrder), asc(cmsMenuItems.name));

    const items = limit != null ? await base.limit(limit) : await base;
    return items;
  } catch (error) {
    console.error('[getMenuItems] Error:', error);
    return [];
  }
});

/**
 * Get complete menu with categories
 * Returns restaurant, categories, and items organized by category
 */
export const getCompleteMenu = cache(async () => {
  try {
    // Get restaurant
    const restaurant = await getHubRestaurant();
    if (!restaurant) {
      return {
        restaurant: null,
        categories: [],
        itemsByCategory: new Map(),
      };
    }

    // Get categories
    const categoryRows = await db
      .select({
        id: menuCategories.id,
        name: menuCategories.name,
        displayOrder: menuCategories.displayOrder,
      })
      .from(menuCategories)
      .where(eq(menuCategories.restaurantId, restaurant.id))
      .orderBy(asc(menuCategories.displayOrder), asc(menuCategories.name));

    // Get menu items
    const categoryIds = categoryRows.map((c) => c.id);
    const itemRows = categoryIds.length
      ? await db
          .select({
            id: cmsMenuItems.id,
            categoryId: cmsMenuItems.categoryId,
            name: cmsMenuItems.name,
            price: cmsMenuItems.price,
            currency: cmsMenuItems.currency,
            description: cmsMenuItems.description,
            isAvailable: cmsMenuItems.isAvailable,
          })
          .from(cmsMenuItems)
          .where(inArray(cmsMenuItems.categoryId, categoryIds))
          .orderBy(asc(cmsMenuItems.displayOrder), asc(cmsMenuItems.name))
      : [];

    // Organize items by category
    const itemsByCategory = new Map<string, typeof itemRows>();
    for (const item of itemRows) {
      const key = item.categoryId ?? '';
      if (!itemsByCategory.has(key)) {
        itemsByCategory.set(key, []);
      }
      itemsByCategory.get(key)?.push(item);
    }

    return {
      restaurant,
      categories: categoryRows,
      itemsByCategory,
    };
  } catch (error) {
    console.error('[getCompleteMenu] Error:', error);
    return {
      restaurant: null,
      categories: [],
      itemsByCategory: new Map(),
    };
  }
});

/**
 * Type exports
 */
export type Restaurant = Awaited<ReturnType<typeof getHubRestaurant>>;
export type MenuItem = Awaited<ReturnType<typeof getMenuItems>>[0];
export type CompleteMenu = Awaited<ReturnType<typeof getCompleteMenu>>;
