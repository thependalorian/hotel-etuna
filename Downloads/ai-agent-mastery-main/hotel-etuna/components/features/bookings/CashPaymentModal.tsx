/**
 * Cash Payment Modal Component
 * 
 * Purpose: Modal for marking cash bookings as paid
 * Location: components/features/bookings/CashPaymentModal.tsx
 * 
 * Features:
 * - Input amount tendered
 * - Auto-calculate change
 * - Real-time validation
 * - Calls PATCH /api/bookings/[id]/payment
 * - Success/error feedback
 * 
 * @version 1.0.0
 * @since April 28, 2026
 */

'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/Button';

interface CashPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  bookingId: string;
  bookingReference: string;
  totalAmount: number;
  currency: string;
  onSuccess: () => void;
}

export function CashPaymentModal({
  isOpen,
  onClose,
  bookingId,
  bookingReference,
  totalAmount,
  currency,
  onSuccess,
}: CashPaymentModalProps) {
  const [amountTendered, setAmountTendered] = useState<string>('');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Calculate change
  const tenderedNumber = parseFloat(amountTendered) || 0;
  const changeGiven = tenderedNumber > 0 ? tenderedNumber - totalAmount : 0;

  // Validation
  const isValid = tenderedNumber >= totalAmount;
  const insufficientAmount = tenderedNumber > 0 && tenderedNumber < totalAmount;

  // Reset form when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setAmountTendered('');
      setNotes('');
      setError(null);
    }
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!isValid) {
      setError('Amount tendered must be at least the total amount');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch(`/api/bookings/${bookingId}/payment`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amountTendered: tenderedNumber,
          changeGiven,
          notes: notes || undefined,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || data.message || 'Failed to mark payment as paid');
      }

      // Success!
      onSuccess();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to process payment');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full mx-4 overflow-hidden">
        {/* Header */}
        <div className="bg-terracotta-600 text-white px-6 py-4">
          <h2 className="text-xl font-semibold">Mark Cash Payment as Paid</h2>
          <p className="text-terracotta-100 text-sm mt-1">
            Booking: {bookingReference}
          </p>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Total Amount Display */}
          <div className="bg-khaki-50 border-2 border-khaki-200 rounded-lg p-4">
            <div className="text-sm text-khaki-700 font-medium mb-1">
              Total Amount Due
            </div>
            <div className="text-3xl font-bold text-terracotta-900">
              {currency} {totalAmount.toFixed(2)}
            </div>
          </div>

          {/* Amount Tendered Input */}
          <div>
            <label htmlFor="amountTendered" className="block text-sm font-medium text-gray-700 mb-2">
              Amount Tendered <span className="text-red-600">*</span>
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
                {currency}
              </span>
              <input
                id="amountTendered"
                type="number"
                step="0.01"
                min="0"
                value={amountTendered}
                onChange={(e) => setAmountTendered(e.target.value)}
                className={`w-full pl-16 pr-4 py-3 border-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-terracotta-500 ${
                  insufficientAmount 
                    ? 'border-red-300 bg-red-50' 
                    : 'border-gray-200'
                }`}
                placeholder="0.00"
                required
                disabled={isSubmitting}
                autoFocus
              />
            </div>
            {insufficientAmount && (
              <p className="text-red-600 text-sm mt-1">
                ⚠️ Insufficient amount (need at least {currency} {totalAmount.toFixed(2)})
              </p>
            )}
          </div>

          {/* Change Given Display */}
          <div className={`border-2 rounded-lg p-4 ${
            changeGiven > 0 ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200'
          }`}>
            <div className="text-sm font-medium text-gray-700 mb-1">
              Change to Give
            </div>
            <div className={`text-2xl font-bold ${
              changeGiven > 0 ? 'text-green-700' : 'text-gray-400'
            }`}>
              {currency} {changeGiven.toFixed(2)}
            </div>
            {changeGiven > 0 && (
              <p className="text-xs text-green-600 mt-1">
                ✓ Return this amount to the guest
              </p>
            )}
          </div>

          {/* Notes (Optional) */}
          <div>
            <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-2">
              Notes (Optional)
            </label>
            <textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-terracotta-500 resize-none"
              placeholder="Add any notes about this payment..."
              rows={3}
              disabled={isSubmitting}
            />
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border-2 border-red-200 rounded-lg p-3">
              <p className="text-red-700 text-sm font-medium">
                ❌ {error}
              </p>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isSubmitting}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              disabled={!isValid || isSubmitting}
              className="flex-1"
            >
              {isSubmitting ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4" viewBox="0 0 24 24">
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                      fill="none"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                    />
                  </svg>
                  Processing...
                </>
              ) : (
                'Mark as Paid'
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
