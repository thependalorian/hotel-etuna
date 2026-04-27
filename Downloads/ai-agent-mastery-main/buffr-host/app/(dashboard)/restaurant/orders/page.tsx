/**
 * Restaurant Orders Management Page
 * 
 * Purpose: Manage restaurant orders and deliveries
 * Location: /app/(dashboard)/restaurant/orders/page.tsx
 * 
 * Features:
 * - Property selection
 * - Orders list with details
 * - Order status management
 * 
 * Design System:
 * - Uses semantic tokens: text-base-content, bg-base-100
 * - Button size: min-h-[44px] (Fitt's Law)
 * 
 * Accessibility:
 * - Proper heading hierarchy (h1)
 * - Form labels and ARIA attributes
 * 
 * @module RestaurantOrdersPage
 */

'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import LoadingSpinner from '@/components/shared/LoadingSpinner';
import ErrorDisplay from '@/components/shared/ErrorDisplay';
import EmptyState from '@/components/shared/EmptyState';
import PropertySelector from '@/components/features/restaurant/PropertySelector';
import OrderCard from '@/components/features/restaurant/orders/OrderCard';
import { apiUrl } from '@/lib/utils/api-url';

interface OrderItem {
  id: string;
  item_name: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  customizations?: object | null;
  special_instructions?: string;
}

interface RestaurantOrder {
  id: string;
  order_number: string;
  ordered_at: string;
  status: string;
  total_amount: number;
  order_type: string;
  table_number?: string;
  room_number?: string;
  guest_id: string;
  items: OrderItem[];
}

interface Property {
  id: string;
  name: string;
  type: string;
  has_restaurant_features: boolean;
}

function unwrapData<T>(payload: unknown, fallback: T): T {
  if (payload && typeof payload === 'object' && 'data' in payload) {
    return ((payload as { data?: unknown }).data as T) ?? fallback;
  }
  return (payload as T) ?? fallback;
}

function getString(raw: Record<string, unknown>, keys: string[], fallback = ''): string {
  for (const key of keys) {
    const value = raw[key];
    if (typeof value === 'string' && value.trim()) return value;
  }
  return fallback;
}

function normalizeOrder(rawValue: unknown): RestaurantOrder {
  const raw = rawValue && typeof rawValue === 'object' ? rawValue as Record<string, unknown> : {};
  const id = getString(raw, ['id'], 'unknown');
  return {
    id,
    order_number: getString(raw, ['order_number', 'orderNumber'], id.slice(0, 8) || 'Unknown'),
    ordered_at: getString(raw, ['ordered_at', 'orderedAt', 'created_at', 'createdAt']),
    status: getString(raw, ['status'], 'pending'),
    total_amount: Number(raw.total_amount ?? raw.totalAmount ?? 0),
    order_type: getString(raw, ['order_type', 'orderType'], 'dine_in'),
    table_number: getString(raw, ['table_number', 'tableNumber']) || undefined,
    room_number: getString(raw, ['room_number', 'roomNumber']) || undefined,
    guest_id: getString(raw, ['guest_id', 'guestId']),
    items: Array.isArray(raw.items) ? (raw.items as OrderItem[]) : [],
  };
}

export default function RestaurantOrdersPage() {
  const { data: session, status } = useSession();
  const [properties, setProperties] = useState<Property[]>([]);
  const [selectedPropertyId, setSelectedPropertyId] = useState<string | null>(null);
  const [restaurantId, setRestaurantId] = useState<string | null>(null);
  const [orders, setOrders] = useState<RestaurantOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (status === 'authenticated' && session?.user?.tenantId) {
      const fetchProperties = async () => {
        try {
          const response = await fetch(apiUrl('/api/properties'));
          if (!response.ok) {
            throw new Error('Failed to fetch properties');
          }
          const payload = await response.json();
          const data = unwrapData<Property[]>(payload, []);
          const restaurantProperties = data.filter(p => p.type === 'restaurant' || p.has_restaurant_features);
          setProperties(restaurantProperties);
          if (restaurantProperties.length > 0) {
            setSelectedPropertyId(restaurantProperties[0].id);
          }
        } catch (err: unknown) {
          const error = err as Error;
          setError(error.message);
        } finally {
          setLoading(false);
        }
      };
      fetchProperties();
    }
  }, [status, session?.user?.tenantId]);

  useEffect(() => {
    if (selectedPropertyId) {
      const fetchRestaurantId = async () => {
        try {
          const response = await fetch(apiUrl(`/api/restaurant/details?propertyId=${selectedPropertyId}`));
          if (!response.ok) {
            throw new Error('Failed to fetch restaurant details');
          }
          const payload = await response.json();
          const data = unwrapData<{ id?: string }>(payload, {});
          setRestaurantId(data.id ?? null);
        } catch (err: unknown) {
          const error = err as Error;
          setError(error.message);
        }
      };
      fetchRestaurantId();
    }
  }, [selectedPropertyId]);

  useEffect(() => {
    if (restaurantId) {
      const fetchOrders = async () => {
        try {
          const response = await fetch(apiUrl(`/api/restaurant/orders?restaurantId=${restaurantId}`));
          if (!response.ok) {
            throw new Error('Failed to fetch orders');
          }
          const payload = await response.json();
          const data = unwrapData<unknown[]>(payload, []);
          setOrders(Array.isArray(data) ? data.map(normalizeOrder) : []);
        } catch (err: unknown) {
          const error = err as Error;
          setError(error.message);
        }
      };
      fetchOrders();
    }
  }, [restaurantId]);

  if (loading || status === 'loading') {
    return (
      <div className="flex items-center justify-center min-h-64">
        <LoadingSpinner size="lg" text="Loading order management..." />
      </div>
    );
  }

  if (error) {
    return (
      <ErrorDisplay 
        error={error} 
        title="Error Loading Orders"
        variant="full"
      />
    );
  }

  if (!session) {
    return (
      <div className="card bg-warning/10 border border-warning shadow-lg">
        <div className="card-body">
          <p className="text-warning font-medium">Please log in to manage your orders.</p>
        </div>
      </div>
    );
  }

  if (properties.length === 0) {
    return (
      <EmptyState
        title="No Restaurant Properties Found"
        description="Please add a property with restaurant features to manage orders."
        action={{
          label: "Add New Property",
          href: "/properties/new"
        }}
        size="md"
      />
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="dashboard-surface rounded-[1.75rem] p-6 sm:p-8">
        <span className="ops-pill mb-4">Kitchen workflow</span>
        <h1 className="text-3xl md:text-4xl font-black mb-2">Order Management</h1>
        <p className="max-w-2xl text-ink-500">
          Manage restaurant order states through the same validated lifecycle used by the API.
          Staff can only move orders through allowed kitchen transitions.
        </p>
      </div>

      <PropertySelector 
        properties={properties}
        selectedPropertyId={selectedPropertyId}
        onPropertyChange={setSelectedPropertyId}
      />

      {restaurantId ? (
        <div className="space-y-4">
          <h3 className="text-xl font-black text-ink-950">Recent Orders</h3>
          {orders.length === 0 ? (
            <EmptyState
              title="No orders found"
              description="No orders found for this restaurant."
              size="md"
            />
          ) : (
            <div className="space-y-4">
              {orders.map((order, index) => (
                <OrderCard key={order.id} order={order} index={index} />
              ))}
            </div>
          )}
        </div>
      ) : (
        <div className="card bg-base-100 shadow-lg">
          <div className="card-body text-center py-12">
            <p className="text-base-content/70">Select a property to manage its orders.</p>
          </div>
        </div>
      )}
    </div>
  );
}
