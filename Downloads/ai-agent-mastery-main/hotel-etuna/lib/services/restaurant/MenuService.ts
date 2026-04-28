import { db, cmsMenuItems as cmsMenuItemsSchema, menuCategories as menuCategoriesSchema } from '@/lib/db';
import { MenuItemData, MenuCategoryData } from '@/lib/types/restaurant';
import { MenuCategory, NewMenuCategory, CmsMenuItem, NewCmsMenuItem } from '@/lib/db/schema';
import { AppError, handleServiceError } from '@/lib/utils/errors';
import { and, eq, asc } from 'drizzle-orm';

export class MenuService {
  async createMenuItem(tenantId: string, _propertyId: string, data: MenuItemData): Promise<CmsMenuItem> {
    try {
      const price = data.price || 0;
      const currency = 'NAD';

      const newMenuItemData: NewCmsMenuItem = {
        restaurantId: data.restaurantId,
        categoryId: data.categoryId,
        name: data.name,
        description: data.description || null,
        price: price.toString(),
        currency: currency,
        imageUrl: data.image_url || null,
        dietaryTags: data.dietary_info || [],
        allergens: data.allergens || [],
        isAvailable: data.is_available !== false,
        displayOrder: data.display_order || 0,
      };

      const newMenuItems = await db.insert(cmsMenuItemsSchema).values(newMenuItemData).returning();
      return newMenuItems[0];
    } catch (error) {
      return handleServiceError(error, 'Error creating menu item');
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

  async createMenuCategory(tenantId: string, restaurantId: string, data: MenuCategoryData): Promise<MenuCategory> {
    try {
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
        .where(and(eq(menuCategoriesSchema.restaurantId, restaurantId), eq(menuCategoriesSchema.isActive, true)))
        .orderBy(asc(menuCategoriesSchema.displayOrder));
      return categories;
    } catch (error) {
      handleServiceError(error, 'Error fetching menu categories by restaurant');
      return [];
    }
  }

  // Helper to generate a URL-friendly slug
  private generateSlug(name: string): string {
    const slug = name
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '') // Remove special characters
      .replace(/\s+/g, '-') // Replace spaces with hyphens
      .replace(/-+/g, '-'); // Replace multiple hyphens with single

    return slug;
  }
}
