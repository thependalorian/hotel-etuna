/**
 * Restaurant Order Card Component
 * 
 * Purpose: Display individual restaurant order
 * Location: /components/features/restaurant/orders/OrderCard.tsx
 * 
 * Features:
 * - Order number and type
 * - Table/room number
 * - Status badge
 * - Total amount and timestamp
 * - Order items list
 * - Action buttons
 * 
 * Design System:
 * - Uses semantic tokens: text-base-content, bg-base-100
 * - Card shadows: shadow-lg with hover:shadow-xl
 * - Button sizes: min-h-[44px]
 * 
 * Accessibility:
 * - Semantic HTML structure
 * - Proper heading hierarchy (h4)
 * - ARIA labels for buttons
 * 
 * @param {Object} order - Order data object
 * @param {number} index - Index for animation delay
 * 
 * @module OrderCard
 */

'use client';

import { useState } from 'react';
import { RESTAURANT_ORDER_STATUS_TRANSITIONS } from '@/lib/workflows/domainTransitions';
import { normalizeDbStatus } from '@/lib/utils/status-normalize';
import { WorkflowStatusActions } from '@/components/shared/WorkflowStatusActions';
import { StatusBadge } from '@/components/shared/StatusBadge';

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

interface OrderCardProps {
  order: RestaurantOrder;
  index: number;
}

export default function OrderCard({ order, index }: OrderCardProps) {
  const [status, setStatus] = useState(normalizeDbStatus(order.status));
  const orderedAt = order.ordered_at ? new Date(order.ordered_at) : null;
  const total = Number(order.total_amount || 0);

  return (
    <div 
      className="dashboard-card dashboard-card-hover animate-slide-up"
      style={{ animationDelay: `${index * 50}ms` }}
    >
      <div className="p-5 sm:p-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
          <div>
            <h4 className="text-lg font-black text-ink-950 mb-1">Order #{order.order_number}</h4>
            <p className="text-sm text-ink-500">
              {order.order_type} • {order.table_number || order.room_number || 'No table/room'}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <StatusBadge status={status} size="md" />
            <div className="text-right">
              <p className="text-xl font-black text-ink-950">N${total.toFixed(2)}</p>
              <p className="text-xs text-ink-400">
                {orderedAt ? orderedAt.toLocaleString() : 'Time unavailable'}
              </p>
            </div>
          </div>
        </div>
        
        <div className="p-4 bg-brand-50 rounded-2xl mb-4 border border-base-300/70">
          <p className="text-sm font-bold text-ink-800 mb-2">Items</p>
          <div className="space-y-1">
            {(order.items || []).map((item, itemIndex) => (
              <div key={itemIndex} className="flex justify-between text-sm">
                <span className="text-ink-700">
                  {item.quantity}x {item.item_name}
                </span>
                <span className="font-medium text-ink-500">
                  N${Number(item.total_price || 0).toFixed(2)}
                </span>
              </div>
            ))}
            {(!order.items || order.items.length === 0) && (
              <p className="text-sm text-ink-400">No line items attached.</p>
            )}
          </div>
        </div>

        <WorkflowStatusActions
          currentStatus={status}
          transitions={RESTAURANT_ORDER_STATUS_TRANSITIONS}
          endpoint={`/api/restaurant/orders/${order.id}/status`}
          compact
          onUpdated={setStatus}
        />
      </div>
    </div>
  );
}
