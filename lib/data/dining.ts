/**
 * Shared Data Access Layer — Dining/Restaurant (live Neon DB only).
 * Location: lib/data/dining.ts
 */

import { db } from '@/lib/db';
import { restaurants, cmsMenuItems, menuCategories } from '@/lib/db/schema';
import { eq, and, inArray, asc } from 'drizzle-orm';
import { cache } from 'react';
import { resolvePublicHubProperty } from '@/lib/utils/public-property';

async function resolveHubRestaurant() {
  const defaultPropertyId = process.env.DEFAULT_PROPERTY_ID?.trim();

  if (defaultPropertyId) {
    const [fromEnv] = await db
      .select()
      .from(restaurants)
      .where(eq(restaurants.propertyId, defaultPropertyId))
      .limit(1);
    if (fromEnv) return { restaurant: fromEnv, propertyId: defaultPropertyId };
  }

  const { property } = await resolvePublicHubProperty();
  const [fromHub] = await db
    .select()
    .from(restaurants)
    .where(eq(restaurants.propertyId, property.id))
    .limit(1);
  return { restaurant: fromHub ?? null, propertyId: property.id };
}

export const getHubRestaurant = cache(async () => {
  try {
    const { restaurant } = await resolveHubRestaurant();
    return restaurant;
  } catch (error) {
    console.error('[getHubRestaurant] Error:', error);
    return null;
  }
});

export const getMenuItems = cache(async (limit?: number) => {
  try {
    const { restaurant } = await resolveHubRestaurant();
    if (!restaurant) return [];

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

    return limit != null ? await base.limit(limit) : await base;
  } catch (error) {
    console.error('[getMenuItems] Error:', error);
    return [];
  }
});

async function loadMenuForRestaurantId(restaurantId: string) {
  const categoryRows = await db
    .select({
      id: menuCategories.id,
      name: menuCategories.name,
      description: menuCategories.description,
      displayOrder: menuCategories.displayOrder,
    })
    .from(menuCategories)
    .where(
      and(eq(menuCategories.restaurantId, restaurantId), eq(menuCategories.isActive, true)),
    )
    .orderBy(asc(menuCategories.displayOrder), asc(menuCategories.name));

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
          imageUrl: cmsMenuItems.imageUrl,
          dietaryTags: cmsMenuItems.dietaryTags,
          isAvailable: cmsMenuItems.isAvailable,
        })
        .from(cmsMenuItems)
        .where(
          and(
            inArray(cmsMenuItems.categoryId, categoryIds),
            eq(cmsMenuItems.isAvailable, true),
          ),
        )
        .orderBy(asc(cmsMenuItems.displayOrder), asc(cmsMenuItems.name))
    : [];

  const itemsByCategory = new Map<string, typeof itemRows>();
  for (const item of itemRows) {
    const key = item.categoryId ?? '';
    if (!itemsByCategory.has(key)) {
      itemsByCategory.set(key, []);
    }
    itemsByCategory.get(key)?.push(item);
  }

  return { categories: categoryRows, itemsByCategory };
}

export const getCompleteMenuForProperty = cache(async (propertyId: string) => {
  try {
    const [restaurant] = await db
      .select()
      .from(restaurants)
      .where(eq(restaurants.propertyId, propertyId))
      .limit(1);

    if (!restaurant) {
      return { restaurant: null, propertyId, categories: [], itemsByCategory: new Map() };
    }

    const menu = await loadMenuForRestaurantId(restaurant.id);
    return { restaurant, propertyId, ...menu };
  } catch (error) {
    console.error('[getCompleteMenuForProperty] Error:', error);
    return { restaurant: null, propertyId, categories: [], itemsByCategory: new Map() };
  }
});

export const getCompleteMenu = cache(async () => {
  try {
    const { restaurant, propertyId } = await resolveHubRestaurant();
    if (!restaurant) {
      return {
        restaurant: null,
        propertyId,
        categories: [],
        itemsByCategory: new Map(),
      };
    }

    const menu = await loadMenuForRestaurantId(restaurant.id);
    return { restaurant, propertyId, ...menu };
  } catch (error) {
    console.error('[getCompleteMenu] Error:', error);
    return {
      restaurant: null,
      propertyId: process.env.DEFAULT_PROPERTY_ID ?? '',
      categories: [],
      itemsByCategory: new Map(),
    };
  }
});

export type Restaurant = Awaited<ReturnType<typeof getHubRestaurant>>;
export type MenuItem = Awaited<ReturnType<typeof getMenuItems>>[number];
export type CompleteMenu = Awaited<ReturnType<typeof getCompleteMenu>>;
