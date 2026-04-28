/**
 * Restaurant menu/order implementation tests
 *
 * Purpose: Verify public menu reads real database rows and orders persist line items.
 * Location: tests/integration/restaurant-menu-orders.test.ts
 */

import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { NextRequest } from 'next/server';
import { db, cmsMenuItems, menuCategories } from '@/lib/db';
import { runWithTenantContext } from '@/lib/auth/tenant-context';
import { OrderService } from '@/lib/services/restaurant/OrderService';
import { GET as getPublicRestaurantMenu } from '@/app/api/public/restaurant/menu/[slug]/route';
import {
  cleanupTestData,
  createTestGuest,
  createTestProperty,
  createTestRestaurant,
  createTestTenant,
  createTestUser,
} from '../utils/test-helpers';

describe('Restaurant public menu and order items', () => {
  let tenantId: string;
  let propertyId: string;
  let propertySlug: string;
  let restaurantId: string;
  let guestId: string;
  let availableItemId: string;

  beforeAll(async () => {
    const tenant = await createTestTenant('Restaurant Implementation Test');
    const user = await createTestUser(tenant.id);
    const property = await createTestProperty(tenant.id, user.id, 'Implementation Test Restaurant', 'restaurant');
    const restaurant = await createTestRestaurant(property.id, 'Implementation Bistro', tenant.id);
    const guest = await createTestGuest(tenant.id);

    tenantId = tenant.id;
    propertyId = property.id;
    propertySlug = property.slug;
    restaurantId = restaurant.id;
    guestId = guest.id;

    await runWithTenantContext(tenantId, async () => {
      const [category] = await db
        .insert(menuCategories)
        .values({
          restaurantId,
          name: 'Mains',
          description: 'Main dishes',
          displayOrder: 1,
          isActive: true,
        })
        .returning();

      const [availableItem] = await db
        .insert(cmsMenuItems)
        .values({
          restaurantId,
          categoryId: category.id,
          name: 'Kapana Bowl',
          description: 'Grilled beef with salsa',
          price: '125.00',
          currency: 'NAD',
          isAvailable: true,
          displayOrder: 1,
        })
        .returning();

      await db.insert(cmsMenuItems).values({
        restaurantId,
        categoryId: category.id,
        name: 'Hidden Special',
        price: '999.00',
        currency: 'NAD',
        isAvailable: false,
        displayOrder: 2,
      });

      availableItemId = availableItem.id;
    });
  });

  afterAll(async () => {
    await cleanupTestData(tenantId);
  });

  it('GET /api/public/restaurant/menu/[slug] returns active database menu only', async () => {
    const response = await getPublicRestaurantMenu(
      new NextRequest(`http://localhost:3000/api/public/restaurant/menu/${propertySlug}`),
      { params: Promise.resolve({ slug: propertySlug }) }
    );

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(Array.isArray(body)).toBe(true);
    expect(body).toHaveLength(1);
    expect(body[0].name).toBe('Mains');
    expect(body[0].items).toHaveLength(1);
    expect(body[0].items[0].name).toBe('Kapana Bowl');
  });

  it('OrderService persists and reads restaurant order line items', async () => {
    const service = new OrderService();

    const order = await runWithTenantContext(tenantId, () =>
      service.createOrder(tenantId, {
        restaurantId,
        propertyId,
        guestId,
        orderType: 'dine_in',
        tableNumber: 'T1',
        items: [
          {
            menuItemId: availableItemId,
            quantity: 2,
            unitPrice: 125,
            totalPrice: 250,
            customizations: { spice: 'medium' },
            specialInstructions: 'Sauce on the side',
          },
        ],
      })
    );

    const fetched = await runWithTenantContext(tenantId, () => service.getOrderById(order.id, tenantId));
    expect(fetched.items).toHaveLength(1);
    expect(fetched.items[0].menuItemId).toBe(availableItemId);
    expect(fetched.items[0].menuItemName).toBe('Kapana Bowl');
    expect(fetched.items[0].quantity).toBe(2);

    const list = await runWithTenantContext(tenantId, () => service.getOrdersByRestaurant(restaurantId));
    expect(list.some((row) => row.id === order.id && row.items.length === 1)).toBe(true);
  });
});
