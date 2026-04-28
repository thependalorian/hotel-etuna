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

  // Calculate time elapsed for priority indicator
  const timeElapsed = orderedAt ? Math.floor((Date.now() - orderedAt.getTime()) / 60000) : 0;
  const timeColor = timeElapsed > 30 ? 'semantic-error' : timeElapsed > 15 ? 'semantic-warning' : 'semantic-success';

  return (
    <div 
      className="rounded-lg border-l-4 bg-surface-elevated shadow-nude-soft hover:shadow-nude-medium transition-all duration-200 animate-slide-up overflow-hidden"
      style={{ 
        animationDelay: `${index * 50}ms`,
        borderLeftColor: `var(--color-${timeColor})`,
      }}
    >
      <div className="p-5 sm:p-6">
        {/* Order Header with Status and Timer */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h4 className="font-display text-lg font-bold text-nude-900">Order #{order.order_number}</h4>
              {timeElapsed > 30 && (
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-bold bg-semantic-error text-white">
                  HIGH PRIORITY
                </span>
              )}
            </div>
            <p className="text-sm text-nude-600 font-medium">
              {order.order_type} • {order.table_number || order.room_number || 'No table/room'}
            </p>
          </div>
          
          <div className="flex items-center gap-3">
            <StatusBadge status={status} showDot />
            <div className="text-right">
              <p className="font-display text-2xl font-bold text-nude-900">N${total.toFixed(2)}</p>
              <div className={`text-xs font-semibold ${timeElapsed > 30 ? 'text-semantic-error' : timeElapsed > 15 ? 'text-semantic-warning' : 'text-semantic-success'}`}>
                {timeElapsed}min elapsed
              </div>
            </div>
          </div>
        </div>
        
        {/* Order Items */}
        <div className="p-4 bg-nude-50 rounded-lg mb-4 border border-nude-200">
          <p className="text-sm font-semibold text-nude-800 mb-3">Order Items</p>
          <div className="space-y-2">
            {(order.items || []).map((item, itemIndex) => (
              <div key={itemIndex} className="flex justify-between items-center text-sm py-1">
                <span className="text-nude-900 font-medium">
                  <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-nude-200 text-nude-800 text-xs font-bold mr-2">
                    {item.quantity}
                  </span>
                  {item.item_name}
                </span>
                <span className="font-semibold text-nude-900">
                  N${Number(item.total_price || 0).toFixed(2)}
                </span>
              </div>
            ))}
            {(!order.items || order.items.length === 0) && (
              <p className="text-sm text-nude-500 italic">No items attached.</p>
            )}
          </div>
        </div>

        {/* Status Actions */}
        <div className="pt-4 border-t border-nude-200">
          <WorkflowStatusActions
            currentStatus={status}
            transitions={RESTAURANT_ORDER_STATUS_TRANSITIONS}
            endpoint={`/api/restaurant/orders/${order.id}/status`}
            compact
            onUpdated={setStatus}
          />
        </div>
      </div>
    </div>
  );
}
