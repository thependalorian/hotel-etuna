import {
  db,
  restaurantOrders as restaurantOrdersSchema,
  restaurantOrderItems as restaurantOrderItemsSchema,
  guests,
  restaurants,
  cmsMenuItems,
} from '@/lib/db';
import { OrderData } from '@/lib/types/restaurant';
import { RestaurantOrder, NewRestaurantOrder } from '@/lib/db/schema';
import { AppError, handleServiceError } from '@/lib/utils/errors';
import { and, eq, desc, inArray } from 'drizzle-orm';
import { RESTAURANT_ORDER_STATUS_TRANSITIONS } from '@/lib/workflows/domainTransitions';
import { invokeLifecycleTransition } from '@/lib/workflows/genericLifecycleGraph';

export class OrderService {
  async createOrder(tenantId: string, data: OrderData): Promise<RestaurantOrder> {
    try {
      const orderNumber = `ORD-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

      const newOrderData: NewRestaurantOrder = {
        restaurantId: data.restaurantId,
        propertyId: data.propertyId,
        guestId: data.guestId,
        cartId: data.cartId,
        tableId: data.tableId,
        qrCode: data.qrCode,
        bookingId: data.bookingId,
        orderNumber: orderNumber,
        orderType: data.orderType || 'dine_in',
        tableNumber: data.tableNumber,
        roomNumber: data.roomNumber,
        status: 'pending',
        specialInstructions: data.specialInstructions,
        tenantId: tenantId,
      };

      const [newOrder] = await db.transaction(async (tx) => {
        const newOrders = await tx.insert(restaurantOrdersSchema).values(newOrderData).returning();
        const order = newOrders[0];

        if (!order) {
          throw new AppError(500, 'Failed to create order');
        }

        await tx.insert(restaurantOrderItemsSchema).values(
          data.items.map((item) => ({
            orderId: order.id,
            menuItemId: item.menuItemId,
            quantity: item.quantity,
            unitPrice: item.unitPrice.toString(),
            totalPrice: item.totalPrice.toString(),
            customizations: item.customizations ?? {},
            specialInstructions: item.specialInstructions,
          }))
        );

        return [order];
      });

      const { inventoryService } = await import('@/lib/services/inventory/InventoryService');
      await inventoryService.deductForOrder(newOrder.id);

      return newOrder;
    } catch (error) {
      throw handleServiceError(error, 'Error creating order');
    }
  }

  async getOrdersByRestaurant(restaurantId: string): Promise<any[]> {
    try {
      const rows = await db
        .select()
        .from(restaurantOrdersSchema)
        .leftJoin(guests, eq(restaurantOrdersSchema.guestId, guests.id))
        .where(eq(restaurantOrdersSchema.restaurantId, restaurantId))
        .orderBy(desc(restaurantOrdersSchema.orderedAt));

      const orders = rows.map((r) => ({ ...r.restaurant_orders, guest: r.guests } as any));
      if (orders.length === 0) return orders;

      const orderIds = orders.map((order) => order.id);
      const items = await db
        .select({
          item: restaurantOrderItemsSchema,
          menuItemName: cmsMenuItems.name,
        })
        .from(restaurantOrderItemsSchema)
        .leftJoin(cmsMenuItems, eq(restaurantOrderItemsSchema.menuItemId, cmsMenuItems.id))
        .where(inArray(restaurantOrderItemsSchema.orderId, orderIds));

      return orders.map((order) => ({
        ...order,
        items: items
          .filter((row) => row.item.orderId === order.id)
          .map((row) => ({ ...row.item, menuItemName: row.menuItemName })),
      }));
    } catch (error) {
      throw handleServiceError(error, 'Error fetching orders by restaurant');
    }
  }

  async getOrderById(orderId: string, tenantId: string): Promise<any> {
    try {
      const rows = await db
        .select()
        .from(restaurantOrdersSchema)
        .leftJoin(guests, eq(restaurantOrdersSchema.guestId, guests.id))
        .leftJoin(restaurants, eq(restaurantOrdersSchema.restaurantId, restaurants.id))
        .where(and(eq(restaurantOrdersSchema.id, orderId), eq(restaurantOrdersSchema.tenantId, tenantId)))
        .limit(1);
      const row = rows[0];
      if (!row) {
        throw new AppError(404, 'Order not found');
      }
      const items = await db
        .select({
          item: restaurantOrderItemsSchema,
          menuItemName: cmsMenuItems.name,
        })
        .from(restaurantOrderItemsSchema)
        .leftJoin(cmsMenuItems, eq(restaurantOrderItemsSchema.menuItemId, cmsMenuItems.id))
        .where(eq(restaurantOrderItemsSchema.orderId, orderId));

      return {
        ...row.restaurant_orders,
        guest: row.guests,
        restaurant: row.restaurants,
        items: items.map((item) => ({ ...item.item, menuItemName: item.menuItemName })),
      };
    } catch (error) {
      throw handleServiceError(error, 'Error fetching order by ID');
    }
  }

  /** F&B order status — validated by LangGraph lifecycle */
  async transitionOrderStatus(
    orderId: string,
    tenantId: string,
    targetStatus: string
  ): Promise<RestaurantOrder> {
    try {
      const order = await this.getOrderById(orderId, tenantId);
      const out = await invokeLifecycleTransition(
        'restaurant_order',
        RESTAURANT_ORDER_STATUS_TRANSITIONS,
        order.status || 'pending',
        targetStatus
      );
      if (out.errorMessage || !out.resolvedStatus) {
        throw new AppError(400, out.errorMessage || 'Invalid order status transition');
      }
      const [updated] = await db
        .update(restaurantOrdersSchema)
        .set({ status: out.resolvedStatus, updatedAt: new Date() })
        .where(
          and(
            eq(restaurantOrdersSchema.id, orderId),
            eq(restaurantOrdersSchema.tenantId, tenantId)
          )
        )
        .returning();
      if (!updated) {
        throw new AppError(500, 'Failed to update order');
      }
      return updated;
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw handleServiceError(error, 'transition order status');
    }
  }
}