/**
 * MenuService - Menu and restaurant item CRUD
 * Location: /lib/services/menu/MenuService.ts
 * Uses Drizzle ORM (db from @/lib/db) and raw SQL where needed (shopping_cart tables not in schema).
 */

interface MenuItemRow {
  restaurant_id: string;
  restaurant_name: string;
  property_name: string;
  property_type: string;
  property_address?: string | null;
  property_city?: string | null;
  [key: string]: unknown;
}

interface CategoryStatRow {
  category_id: string;
  count: bigint;
}

interface MenuItemData {
  propertyId: string;
  name: string;
  description?: string;
  category: string;
  price: number;
  currency?: string;
  ingredients?: string[];
  allergens?: string[];
  dietary?: string[];
  preparationTime?: number;
  spicyLevel?: number;
  isAvailable?: boolean;
  isVegetarian?: boolean;
  isVegan?: boolean;
  isGlutenFree?: boolean;
  calories?: number;
  images?: string[];
}

import { db, executeRawSql, restaurants, menuCategories, cmsMenuItems, properties, normalizeRows, firstRow } from '@/lib/db';
import { handleServiceError } from '@/lib/utils/errors';
import {
  cmsMenuItems as cmsMenuItemsSchema,
  menuCategories as menuCategoriesSchema,
  type MenuCategory,
  type CmsMenuItem,
  type NewMenuCategory,
  type NewCmsMenuItem,
} from '@/lib/db/schema';
import { eq, and, inArray, asc } from 'drizzle-orm';
import type {
  MenuItemData as RestaurantMenuItemPayload,
  MenuCategoryData as RestaurantMenuCategoryPayload,
} from '@/lib/types/restaurant';

export class MenuService {
  async createMenuItem(tenantId: string, menuItemData: MenuItemData) {
    try {
      const [restaurant] = await db
        .select({ id: restaurants.id })
        .from(restaurants)
        .innerJoin(properties, eq(restaurants.propertyId, properties.id))
        .where(
          and(
            eq(properties.tenantId, tenantId),
            eq(restaurants.propertyId, menuItemData.propertyId)
          )
        )
        .limit(1);

      if (!restaurant) {
        throw new Error('Restaurant not found for this property');
      }

      const [existingCategory] = await db
        .select()
        .from(menuCategories)
        .where(
          and(
            eq(menuCategories.restaurantId, restaurant.id),
            eq(menuCategories.name, menuItemData.category)
          )
        )
        .limit(1);

      let category = existingCategory;
      if (!category) {
        const [created] = await db
          .insert(menuCategories)
          .values({
            restaurantId: restaurant.id,
            name: menuItemData.category,
          })
          .returning();
        category = created!;
      }

      const [menuItem] = await db
        .insert(cmsMenuItems)
        .values({
          restaurantId: restaurant.id,
          categoryId: category.id,
          name: menuItemData.name,
          description: menuItemData.description ?? null,
          price: String(menuItemData.price),
          currency: menuItemData.currency ?? 'NAD',
          allergens: menuItemData.allergens ?? [],
          dietaryTags: menuItemData.dietary ?? [],
          isAvailable: menuItemData.isAvailable !== false,
          displayOrder: 0,
        })
        .returning();

      if (!menuItem) throw new Error('Insert did not return menu item');

      const fullRows = await executeRawSql`
        SELECT mi.*, r.id as restaurant_id, r.name as restaurant_name,
               p.name as property_name, p.type as property_type
        FROM cms_menu_items mi
        JOIN restaurants r ON mi.restaurant_id = r.id
        JOIN properties p ON r.property_id = p.id
        WHERE mi.id = ${menuItem.id}
      `;
      const row = firstRow<MenuItemRow>(fullRows);
      if (!row) {
        const [r] = await db.select({ name: restaurants.name }).from(restaurants).where(eq(restaurants.id, restaurant.id)).limit(1);
        const [prop] = await db.select({ name: properties.name, type: properties.type }).from(properties).where(eq(properties.id, menuItemData.propertyId)).limit(1);
        return {
          ...menuItem,
          restaurant: { id: restaurant.id, name: r?.name ?? '', property: { name: prop?.name ?? '', type: prop?.type ?? '' } },
        };
      }
      return {
        ...row,
        restaurant: {
          id: row.restaurant_id,
          name: row.restaurant_name,
          property: { name: row.property_name, type: row.property_type },
        },
      };
    } catch (error) {
      console.error('Error creating menu item:', error);
      throw error;
    }
  }

  async getMenuItemsByProperty(propertyId: string, tenantId: string) {
    try {
      const rows = await executeRawSql`
        SELECT mi.*, r.id as restaurant_id, r.name as restaurant_name,
               p.name as property_name, p.type as property_type,
               (SELECT COUNT(*)::int FROM shopping_cart_items sci WHERE sci.menu_item_id = mi.id) as order_count
        FROM cms_menu_items mi
        JOIN restaurants r ON mi.restaurant_id = r.id
        JOIN properties p ON r.property_id = p.id
        WHERE r.property_id = ${propertyId} AND p.tenant_id = ${tenantId}
        ORDER BY mi.display_order ASC, mi.name ASC
      `;
      const list = normalizeRows<Record<string, unknown>>(rows);
      return list.map((item) => ({
        ...item,
        orderCount: Number(item.order_count) || 0,
        restaurant: {
          id: item.restaurant_id,
          name: item.restaurant_name,
          property: { name: item.property_name, type: item.property_type },
        },
      }));
    } catch (error) {
      console.error('Error fetching menu items:', error);
      throw error;
    }
  }

  async getMenuItemById(menuItemId: string, tenantId: string) {
    try {
      const menuRows = await executeRawSql`
        SELECT mi.*, r.id as restaurant_id, r.name as restaurant_name,
               p.name as property_name, p.type as property_type,
               p.address as property_address, p.city as property_city
        FROM cms_menu_items mi
        JOIN restaurants r ON mi.restaurant_id = r.id
        JOIN properties p ON r.property_id = p.id
        WHERE mi.id = ${menuItemId} AND p.tenant_id = ${tenantId}
      `;
      const menuItem = firstRow(menuRows);
      if (!menuItem) return null;

      let cartRows: unknown[] = [];
      try {
        const cartResult = await executeRawSql`
          SELECT sci.*, c.id as cart_id, c.created_at as cart_created_at, c.status as cart_status
          FROM shopping_cart_items sci
          JOIN shopping_carts c ON sci.cart_id = c.id
          WHERE sci.menu_item_id = ${menuItemId}
          ORDER BY sci.created_at DESC
          LIMIT 10
        `;
        cartRows = normalizeRows(cartResult);
      } catch {
        // shopping_cart tables may not exist
      }

      const formattedCartItems = (cartRows as Record<string, unknown>[]).map((item) => ({
        ...item,
        cart: {
          id: item.cart_id,
          createdAt: item.cart_created_at,
          status: item.cart_status,
        },
      }));

      const m = menuItem as MenuItemRow;
      return {
        ...menuItem,
        restaurant: {
          id: m.restaurant_id,
          name: m.restaurant_name,
          property: {
            name: m.property_name,
            type: m.property_type,
            address: m.property_address ?? undefined,
            city: m.property_city ?? undefined,
          },
        },
        cart_items: formattedCartItems,
      };
    } catch (error) {
      console.error('Error fetching menu item:', error);
      throw error;
    }
  }

  async updateMenuItem(menuItemId: string, tenantId: string, menuItemData: Partial<MenuItemData>) {
    try {
      const [existing] = await db
        .select({ id: cmsMenuItems.id })
        .from(cmsMenuItems)
        .innerJoin(restaurants, eq(cmsMenuItems.restaurantId, restaurants.id))
        .innerJoin(properties, eq(restaurants.propertyId, properties.id))
        .where(and(eq(cmsMenuItems.id, menuItemId), eq(properties.tenantId, tenantId)))
        .limit(1);

      if (!existing) {
        throw new Error('Menu item not found');
      }

      const set: Record<string, unknown> = { updatedAt: new Date() };
      if (menuItemData.name !== undefined) set.name = menuItemData.name;
      if (menuItemData.description !== undefined) set.description = menuItemData.description;
      if (menuItemData.allergens !== undefined) set.allergens = menuItemData.allergens;
      if (menuItemData.dietary !== undefined) set.dietaryTags = menuItemData.dietary;
      if (menuItemData.isAvailable !== undefined) set.isAvailable = menuItemData.isAvailable;
      await db.update(cmsMenuItems).set(set as Partial<typeof cmsMenuItems.$inferInsert>).where(eq(cmsMenuItems.id, menuItemId));

      const fullRows = await executeRawSql`
        SELECT mi.*, r.id as restaurant_id, r.name as restaurant_name,
               p.name as property_name, p.type as property_type
        FROM cms_menu_items mi
        JOIN restaurants r ON mi.restaurant_id = r.id
        JOIN properties p ON r.property_id = p.id
        WHERE mi.id = ${menuItemId}
      `;
      const row = firstRow<MenuItemRow>(fullRows);
      if (!row) throw new Error('Menu item not found after update');

      return {
        ...row,
        restaurant: {
          id: row.restaurant_id,
          name: row.restaurant_name,
          property: { name: row.property_name, type: row.property_type },
        },
      };
    } catch (error) {
      console.error('Error updating menu item:', error);
      throw error;
    }
  }

  async deleteMenuItem(menuItemId: string, tenantId: string) {
    try {
      const [existing] = await db
        .select({ id: cmsMenuItems.id })
        .from(cmsMenuItems)
        .innerJoin(restaurants, eq(cmsMenuItems.restaurantId, restaurants.id))
        .innerJoin(properties, eq(restaurants.propertyId, properties.id))
        .where(and(eq(cmsMenuItems.id, menuItemId), eq(properties.tenantId, tenantId)))
        .limit(1);

      if (!existing) {
        throw new Error('Menu item not found');
      }

      let activeCarts: unknown[] = [];
      try {
        const carts = await executeRawSql`
          SELECT sci.id FROM shopping_cart_items sci
          JOIN shopping_carts c ON sci.cart_id = c.id
          WHERE sci.menu_item_id = ${menuItemId} AND c.status IN ('ACTIVE', 'PENDING', 'CHECKOUT')
        `;
        activeCarts = normalizeRows(carts);
      } catch {
        // ignore
      }

      if (activeCarts.length > 0) {
        throw new Error('Cannot delete menu item with active carts');
      }

      await db.delete(cmsMenuItems).where(eq(cmsMenuItems.id, menuItemId));
      return { success: true, message: 'Menu item deleted successfully' };
    } catch (error) {
      console.error('Error deleting menu item:', error);
      throw error;
    }
  }

  async toggleMenuItemAvailability(menuItemId: string, tenantId: string) {
    try {
      const [existing] = await db
        .select({ id: cmsMenuItems.id, isAvailable: cmsMenuItems.isAvailable })
        .from(cmsMenuItems)
        .innerJoin(restaurants, eq(cmsMenuItems.restaurantId, restaurants.id))
        .innerJoin(properties, eq(restaurants.propertyId, properties.id))
        .where(and(eq(cmsMenuItems.id, menuItemId), eq(properties.tenantId, tenantId)))
        .limit(1);

      if (!existing) {
        throw new Error('Menu item not found');
      }

      const [updated] = await db
        .update(cmsMenuItems)
        .set({ isAvailable: !existing.isAvailable, updatedAt: new Date() })
        .where(eq(cmsMenuItems.id, menuItemId))
        .returning();

      return updated ?? existing;
    } catch (error) {
      console.error('Error toggling menu item availability:', error);
      throw error;
    }
  }

  async getMenuCategories(propertyId: string, tenantId: string) {
    try {
      const categoriesResult = await executeRawSql`
        SELECT mi.category_id, COUNT(*)::bigint as count
        FROM cms_menu_items mi
        JOIN restaurants r ON mi.restaurant_id = r.id
        JOIN properties p ON r.property_id = p.id
        WHERE r.property_id = ${propertyId} AND p.tenant_id = ${tenantId}
        GROUP BY mi.category_id
      `;
      const rows = (Array.isArray(categoriesResult) ? categoriesResult : (categoriesResult as { rows?: CategoryStatRow[] })?.rows ?? []) as CategoryStatRow[];
      const categoryIds = rows.map((r) => r.category_id).filter(Boolean);
      const details =
        categoryIds.length > 0
          ? await db.select({ id: menuCategories.id, name: menuCategories.name }).from(menuCategories).where(inArray(menuCategories.id, categoryIds))
          : [];

      return rows.map((cat) => {
        const c = details.find((d) => d.id === cat.category_id);
        return { category: c?.name ?? cat.category_id, count: Number(cat.count) };
      });
    } catch (error) {
      console.error('Error fetching menu categories:', error);
      throw error;
    }
  }

  async getMenuStats(tenantId: string, propertyId?: string) {
    try {
      const statsResult = propertyId
        ? await executeRawSql`
            SELECT mi.category_id, COUNT(*)::bigint as count
            FROM cms_menu_items mi
            JOIN restaurants r ON mi.restaurant_id = r.id
            JOIN properties p ON r.property_id = p.id
            WHERE p.tenant_id = ${tenantId} AND r.property_id = ${propertyId}
            GROUP BY mi.category_id
          `
        : await executeRawSql`
            SELECT mi.category_id, COUNT(*)::bigint as count
            FROM cms_menu_items mi
            JOIN restaurants r ON mi.restaurant_id = r.id
            JOIN properties p ON r.property_id = p.id
            WHERE p.tenant_id = ${tenantId}
            GROUP BY mi.category_id
          `;

      const rows = (Array.isArray(statsResult) ? statsResult : (statsResult as { rows?: CategoryStatRow[] })?.rows ?? []) as CategoryStatRow[];
      const totalItems = rows.reduce((sum, s) => sum + Number(s.count), 0);
      const categoryIds = rows.map((r) => r.category_id).filter(Boolean);
      const details =
        categoryIds.length > 0
          ? await db.select({ id: menuCategories.id, name: menuCategories.name }).from(menuCategories).where(inArray(menuCategories.id, categoryIds))
          : [];

      return {
        totalItems,
        categoryBreakdown: rows.map((stat) => {
          const c = details.find((d) => d.id === stat.category_id);
          return { category: c?.name ?? stat.category_id, count: Number(stat.count) };
        }),
      };
    } catch (error) {
      console.error('Error fetching menu stats:', error);
      throw error;
    }
  }

  async searchMenuItems(
    tenantId: string,
    query: string,
    filters?: {
      propertyId?: string;
      category?: string;
      minPrice?: number;
      maxPrice?: number;
      dietary?: string[];
      isAvailable?: boolean;
      isVegetarian?: boolean;
      isVegan?: boolean;
      isGlutenFree?: boolean;
    }
  ) {
    try {
      const searchPattern = `%${query}%`;
      const rows = await executeRawSql`
        SELECT mi.*, r.id as restaurant_id, r.property_id as restaurant_property_id, r.name as restaurant_name,
               p.name as property_name, p.type as property_type,
               p.address as property_address, p.city as property_city
        FROM cms_menu_items mi
        JOIN restaurants r ON mi.restaurant_id = r.id
        JOIN properties p ON r.property_id = p.id
        WHERE p.tenant_id = ${tenantId}
          AND (LOWER(mi.name) LIKE LOWER(${searchPattern}) OR LOWER(COALESCE(mi.description, '')) LIKE LOWER(${searchPattern}))
        ORDER BY mi.display_order ASC, mi.name ASC
      `;
      let list = normalizeRows<MenuItemRow & { restaurant_property_id?: string; is_available?: boolean }>(rows);
      if (filters?.propertyId) list = list.filter((item) => item.restaurant_property_id === filters!.propertyId);
      if (filters?.isAvailable !== undefined) list = list.filter((item) => item.is_available === filters!.isAvailable);
      return list;
    } catch (error) {
      console.error('Error searching menu items:', error);
      throw error;
    }
  }

  async getPopularMenuItems(tenantId: string, propertyId?: string, limit: number = 10) {
    try {
      const rows = propertyId
        ? await executeRawSql`
            SELECT mi.*, r.id as restaurant_id, r.name as restaurant_name,
                   p.name as property_name, p.type as property_type,
                   COUNT(sci.id)::int as order_count
            FROM cms_menu_items mi
            JOIN restaurants r ON mi.restaurant_id = r.id
            JOIN properties p ON r.property_id = p.id
            LEFT JOIN shopping_cart_items sci ON sci.menu_item_id = mi.id
            WHERE p.tenant_id = ${tenantId} AND r.property_id = ${propertyId}
            GROUP BY mi.id, r.id, r.name, p.name, p.type
            ORDER BY order_count DESC
            LIMIT ${limit}
          `
        : await executeRawSql`
            SELECT mi.*, r.id as restaurant_id, r.name as restaurant_name,
                   p.name as property_name, p.type as property_type,
                   COUNT(sci.id)::int as order_count
            FROM cms_menu_items mi
            JOIN restaurants r ON mi.restaurant_id = r.id
            JOIN properties p ON r.property_id = p.id
            LEFT JOIN shopping_cart_items sci ON sci.menu_item_id = mi.id
            WHERE p.tenant_id = ${tenantId}
            GROUP BY mi.id, r.id, r.name, p.name, p.type
            ORDER BY order_count DESC
            LIMIT ${limit}
          `;
      const list = normalizeRows<Record<string, unknown>>(rows);
      return list.map((item) => ({
        ...item,
        orderCount: Number(item.order_count) || 0,
        restaurant: {
          id: item.restaurant_id,
          name: item.restaurant_name,
          property: { name: item.property_name, type: item.property_type },
        },
      }));
    } catch (error) {
      console.error('Error fetching popular menu items:', error);
      throw error;
    }
  }

  /**
   * Restaurant-scoped menu item create (formerly `lib/services/restaurant/MenuService.ts`).
   * Used by `/api/restaurant/menu` — distinct signature from {@link MenuService#createMenuItem} (property-centric).
   */
  async createRestaurantMenuItem(
    _tenantId: string,
    _propertyId: string,
    data: RestaurantMenuItemPayload
  ): Promise<CmsMenuItem> {
    try {
      const price = data.price || 0;
      const currency = 'NAD';
      const newMenuItemData: NewCmsMenuItem = {
        restaurantId: data.restaurantId,
        categoryId: data.categoryId,
        name: data.name,
        description: data.description || null,
        price: price.toString(),
        currency,
        imageUrl: data.image_url || null,
        dietaryTags: data.dietary_info || [],
        allergens: data.allergens || [],
        isAvailable: data.is_available !== false,
        displayOrder: data.display_order || 0,
      };
      const newMenuItems = await db.insert(cmsMenuItemsSchema).values(newMenuItemData).returning();
      return newMenuItems[0];
    } catch (error) {
      return handleServiceError(error, 'Error creating restaurant menu item');
    }
  }

  async getMenuItemsByRestaurant(restaurantId: string): Promise<CmsMenuItem[]> {
    try {
      const menuItems = await db
        .select()
        .from(cmsMenuItemsSchema)
        .where(eq(cmsMenuItemsSchema.restaurantId, restaurantId))
        .orderBy(asc(cmsMenuItemsSchema.displayOrder));
      return menuItems;
    } catch (error) {
      handleServiceError(error, 'Error fetching menu items by restaurant');
      return [];
    }
  }

  async createRestaurantMenuCategory(
    tenantId: string,
    restaurantId: string,
    data: RestaurantMenuCategoryPayload
  ): Promise<MenuCategory> {
    try {
      void tenantId;
      void restaurantId;
      const newCategoryData: NewMenuCategory = {
        restaurantId: data.restaurantId,
        name: data.name,
        description: data.description,
        displayOrder: data.display_order || 0,
        isActive: data.is_active || true,
      };
      const newCategories = await db.insert(menuCategoriesSchema).values(newCategoryData).returning();
      return newCategories[0];
    } catch (error) {
      return handleServiceError(error, 'Error creating menu category');
    }
  }

  async getMenuCategoriesByRestaurant(restaurantId: string): Promise<MenuCategory[]> {
    try {
      const categories = await db
        .select()
        .from(menuCategoriesSchema)
        .where(
          and(eq(menuCategoriesSchema.restaurantId, restaurantId), eq(menuCategoriesSchema.isActive, true))
        )
        .orderBy(asc(menuCategoriesSchema.displayOrder));
      return categories;
    } catch (error) {
      handleServiceError(error, 'Error fetching menu categories by restaurant');
      return [];
    }
  }
}
