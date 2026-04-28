/**
 * OrderForm Component
 * 
 * Purpose: Form for creating new restaurant orders
 * Location: /components/features/restaurant/OrderForm.tsx
 * 
 * Features:
 * - Table selection
 * - Menu item selection with quantity
 * - Guest information
 * - Special requests
 * - Order submission
 * - Responsive design
 */

'use client';

import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/Card';
import { ImagePlaceholder } from '@/components/ui';
import { Plus, Minus, ShoppingCart, User, Phone } from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import LoadingSpinner from '@/components/shared/LoadingSpinner';

interface MenuItem {
  id: string;
  name: string;
  price: number;
  imageUrl?: string;
}

interface OrderFormProps {
  tableId?: string;
  menuItems: MenuItem[];
  onSubmit: (order: OrderData) => Promise<void>;
  className?: string;
}

interface OrderData {
  tableId?: string;
  guestName: string;
  guestPhone?: string;
  items: Array<{
    menuItemId: string;
    quantity: number;
    specialRequests?: string;
  }>;
  specialRequests?: string;
}

export default function OrderForm({
  tableId,
  menuItems,
  onSubmit,
  className = '',
}: OrderFormProps) {
  const [selectedItems, setSelectedItems] = useState<Map<string, number>>(new Map());
  const [guestName, setGuestName] = useState('');
  const [guestPhone, setGuestPhone] = useState('');
  const [specialRequests, setSpecialRequests] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const updateQuantity = (itemId: string, delta: number) => {
    setSelectedItems((prev) => {
      const newMap = new Map(prev);
      const current = newMap.get(itemId) || 0;
      const newQuantity = Math.max(0, current + delta);
      if (newQuantity === 0) {
        newMap.delete(itemId);
      } else {
        newMap.set(itemId, newQuantity);
      }
      return newMap;
    });
  };

  const getTotal = () => {
    let total = 0;
    selectedItems.forEach((quantity, itemId) => {
      const item = menuItems.find((m) => m.id === itemId);
      if (item) {
        total += item.price * quantity;
      }
    });
    return total;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!guestName.trim()) {
      setError('Guest name is required');
      return;
    }

    if (selectedItems.size === 0) {
      setError('Please select at least one item');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const orderData: OrderData = {
        tableId,
        guestName: guestName.trim(),
        guestPhone: guestPhone.trim() || undefined,
        items: Array.from(selectedItems.entries()).map(([menuItemId, quantity]) => ({
          menuItemId,
          quantity,
        })),
        specialRequests: specialRequests.trim() || undefined,
      };

      await onSubmit(orderData);
      
      // Reset form
      setSelectedItems(new Map());
      setGuestName('');
      setGuestPhone('');
      setSpecialRequests('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create order');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className={cn('', className)}>
      <CardContent className="p-6">
        <h3 className="text-xl font-bold font-display mb-6 flex items-center gap-2">
          <ShoppingCart className="w-5 h-5" />
          Create Order
        </h3>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Guest Information */}
          <div>
            <h4 className="font-semibold mb-3">Guest Information</h4>
            <div className="space-y-3">
              <div className="form-control">
                <label className="label">
                  <span className="label-text font-medium">Guest Name *</span>
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-base-content/60" />
                  <input
                    type="text"
                    value={guestName}
                    onChange={(e) => setGuestName(e.target.value)}
                    className="input input-bordered w-full pl-10 min-h-[44px]"
                    placeholder="Enter guest name"
                    required
                  />
                </div>
              </div>
              <div className="form-control">
                <label className="label">
                  <span className="label-text font-medium">Phone (Optional)</span>
                </label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-base-content/60" />
                  <input
                    type="tel"
                    value={guestPhone}
                    onChange={(e) => setGuestPhone(e.target.value)}
                    className="input input-bordered w-full pl-10 min-h-[44px]"
                    placeholder="Enter phone number"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Menu Items */}
          <div>
            <h4 className="font-semibold mb-3">Select Items</h4>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {menuItems.map((item) => {
                const quantity = selectedItems.get(item.id) || 0;
                return (
                  <div
                    key={item.id}
                    className="flex items-center justify-between p-3 bg-base-200 rounded-lg"
                  >
                    <div className="flex items-center gap-3 flex-1">
                      <div className="relative w-12 h-12 rounded overflow-hidden bg-base-200 flex-shrink-0">
                        <ImagePlaceholder
                          src={item.imageUrl}
                          alt={item.name}
                          fill
                          className="object-cover"
                        />
                      </div>
                      <div className="flex-1">
                        <p className="font-medium">{item.name}</p>
                        <p className="text-sm text-base-content/60">N$ {item.price.toFixed(2)}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => updateQuantity(item.id, -1)}
                        className="btn btn-ghost btn-sm min-h-[32px] w-8 p-0"
                        disabled={quantity === 0}
                        aria-label={`Decrease quantity of ${item.name}`}
                      >
                        <Minus className="w-4 h-4" />
                      </button>
                      <span className="w-8 text-center font-medium">{quantity}</span>
                      <button
                        type="button"
                        onClick={() => updateQuantity(item.id, 1)}
                        className="btn btn-ghost btn-sm min-h-[32px] w-8 p-0"
                        aria-label={`Increase quantity of ${item.name}`}
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Special Requests */}
          <div className="form-control">
            <label className="label">
              <span className="label-text font-medium">Special Requests (Optional)</span>
            </label>
            <textarea
              value={specialRequests}
              onChange={(e) => setSpecialRequests(e.target.value)}
              className="textarea textarea-bordered min-h-[120px]"
              placeholder="Any special requests or notes..."
            />
          </div>

          {/* Total */}
          {selectedItems.size > 0 && (
            <div className="flex justify-between items-center p-4 bg-primary/10 rounded-lg">
              <span className="font-bold text-lg">Total:</span>
              <span className="font-bold text-xl text-primary">N$ {getTotal().toFixed(2)}</span>
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="alert alert-error">
              <span>{error}</span>
            </div>
          )}

          {/* Submit */}
          <button
            type="submit"
            className="btn btn-primary w-full min-h-[44px]"
            disabled={loading || selectedItems.size === 0}
            aria-label="Create order"
          >
            {loading ? (
              <>
                <LoadingSpinner size="sm" />
                Creating Order...
              </>
            ) : (
              <>
                <ShoppingCart className="w-4 h-4 mr-2" />
                Create Order
              </>
            )}
          </button>
        </form>
      </CardContent>
    </Card>
  );
}
