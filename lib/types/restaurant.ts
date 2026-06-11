/**
 * @fileoverview Restaurant domain DTOs (menu items, tables, orders).
 * Location: lib/types/restaurant.ts
 */
export interface MenuItemData {
  restaurantId: string;
  categoryId: string;
  name: string;
  description?: string;
  price: number;
  image_url?: string;
  dietary_info?: string[];
  allergens?: string[];
  preparation_time?: number;
  is_available?: boolean;
  display_order?: number;
}

export interface MenuCategoryData {
  restaurantId: string;
  name: string;
  description?: string;
  display_order?: number;
  is_active?: boolean;
}

export interface TableData {
  restaurantId: string;
  propertyId: string;
  tableNumber: string;
  tableName?: string;
  capacity: number;
  location?: string;
}

export interface OrderItemData {
  menuItemId: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  customizations?: Record<string, unknown>;
  specialInstructions?: string;
}

export interface OrderData {
  restaurantId: string;
  propertyId: string;
  guestId: string;
  cartId?: string;
  tableId?: string;
  qrCode?: string;
  bookingId?: string;
  orderType?: string; // dine_in, takeout, delivery, room_service
  tableNumber?: string;
  roomNumber?: string;
  specialInstructions?: string;
  items: OrderItemData[];
}


