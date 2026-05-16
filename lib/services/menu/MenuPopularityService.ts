/**
 * MenuPopularityService — guest favourites from order analytics (live DB only).
 * Location: lib/services/menu/MenuPopularityService.ts
 */

import { db } from '@/lib/db';
import {
  restaurantOrderItems,
  restaurantOrders,
  cmsMenuItems,
} from '@/lib/db/schema';
import { and, desc, eq, gte, isNotNull, notInArray, sum } from 'drizzle-orm';
import { cache } from 'react';

const DEFAULT_LOOKBACK_DAYS = 90;
const DEFAULT_LIMIT = 6;

const EXCLUDED_ORDER_STATUSES = ['cancelled', 'refunded', 'void'];

export type PopularMenuItem = {
  menuItemId: string;
  name: string;
  orderCount: number;
};

export class MenuPopularityService {
  /**
   * Top menu items by fulfilled order volume (restaurant_order_items.quantity).
   */
  static async getPopularMenuItems(options: {
    tenantId: string;
    propertyId?: string;
    restaurantId?: string;
    limit?: number;
    lookbackDays?: number;
  }): Promise<PopularMenuItem[]> {
    const limit = options.limit ?? DEFAULT_LIMIT;
    const lookbackDays = options.lookbackDays ?? DEFAULT_LOOKBACK_DAYS;
    const since = new Date();
    since.setDate(since.getDate() - lookbackDays);

    const conditions = [
      eq(restaurantOrders.tenantId, options.tenantId),
      gte(restaurantOrders.createdAt, since),
      isNotNull(restaurantOrderItems.menuItemId),
      notInArray(restaurantOrders.status, EXCLUDED_ORDER_STATUSES),
    ];

    if (options.propertyId) {
      conditions.push(eq(restaurantOrders.propertyId, options.propertyId));
    }
    if (options.restaurantId) {
      conditions.push(eq(restaurantOrders.restaurantId, options.restaurantId));
    }

    const rows = await db
      .select({
        menuItemId: restaurantOrderItems.menuItemId,
        name: cmsMenuItems.name,
        orderCount: sum(restaurantOrderItems.quantity).as('order_count'),
      })
      .from(restaurantOrderItems)
      .innerJoin(restaurantOrders, eq(restaurantOrderItems.orderId, restaurantOrders.id))
      .innerJoin(cmsMenuItems, eq(restaurantOrderItems.menuItemId, cmsMenuItems.id))
      .where(and(...conditions))
      .groupBy(restaurantOrderItems.menuItemId, cmsMenuItems.name)
      .orderBy(desc(sum(restaurantOrderItems.quantity)))
      .limit(limit);

    return rows
      .filter((row) => row.menuItemId && Number(row.orderCount) > 0)
      .map((row) => ({
        menuItemId: row.menuItemId!,
        name: row.name,
        orderCount: Number(row.orderCount) || 0,
      }));
  }

  static async getPopularMenuItemIds(options: {
    tenantId: string;
    propertyId?: string;
    restaurantId?: string;
    limit?: number;
    lookbackDays?: number;
  }): Promise<string[]> {
    const popular = await this.getPopularMenuItems(options);
    return popular.map((row) => row.menuItemId);
  }
}

/** Cached for public dining page (per property). */
export const getCachedPopularMenuItemIds = cache(
  async (tenantId: string, propertyId: string, restaurantId?: string) => {
    try {
      return await MenuPopularityService.getPopularMenuItemIds({
        tenantId,
        propertyId,
        restaurantId,
        limit: DEFAULT_LIMIT,
      });
    } catch (error) {
      console.error('[getCachedPopularMenuItemIds]', error);
      return [];
    }
  },
);
