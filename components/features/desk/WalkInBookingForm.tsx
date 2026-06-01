/**
 * Walk-In Booking Form — Create bookings at front desk
 * Location: components/features/desk/WalkInBookingForm.tsx
 *
 * Purpose: Form for desk staff to create walk-in bookings
 * - Guest information capture
 * - Room selection
 * - Date selection
 * - Optional introducer tracking
 * - Payment method selection
 */

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

const walkInBookingSchema = z.object({
  // Guest Information
  guestName: z.string().min(2, 'Name must be at least 2 characters'),
  guestEmail: z.string().email('Invalid email address').optional().or(z.literal('')),
  guestPhone: z.string().min(10, 'Phone must be at least 10 digits'),

  // Booking Details
  roomId: z.string().uuid('Invalid room ID'),
  checkInDate: z.string().min(1, 'Check-in date is required'),
  checkOutDate: z.string().min(1, 'Check-out date is required'),
  numberOfGuests: z.coerce.number().min(1, 'At least 1 guest required'),

  // Payment
  paymentMethod: z.enum(['cash', 'card', 'namqr', 'corporate']),
  totalAmount: z.coerce.number().min(0, 'Amount must be positive'),

  // Optional
  introducerCode: z.string().optional(),
  notes: z.string().optional(),
});

type WalkInBookingFormData = z.infer<typeof walkInBookingSchema>;

export function WalkInBookingForm() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [introducerValidated, setIntroducerValidated] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    setValue,
  } = useForm<WalkInBookingFormData>({
    resolver: zodResolver(walkInBookingSchema),
    defaultValues: {
      numberOfGuests: 1,
      paymentMethod: 'cash',
    },
  });

  const introducerCode = watch('introducerCode');

  const validateIntroducer = async () => {
    if (!introducerCode || introducerCode.trim() === '') {
      setIntroducerValidated(false);
      return;
    }

    try {
      const response = await fetch('/api/introducers/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: introducerCode }),
      });

      if (response.ok) {
        setIntroducerValidated(true);
        setError(null);
      } else {
        setIntroducerValidated(false);
        const data = await response.json();
        setError(data.error || 'Invalid introducer code');
      }
    } catch (err) {
      setIntroducerValidated(false);
      setError('Failed to validate introducer code');
    }
  };

  const onSubmit = async (data: WalkInBookingFormData) => {
    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch('/api/desk/walk-in', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create booking');
      }

      const result = await response.json();
      
      // Success - redirect to booking details
      router.push(`/bookings/${result.bookingId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create booking');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Error Alert */}
      {error && (
        <div className="alert alert-error">
          <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>{error}</span>
        </div>
      )}

      {/* Guest Information */}
      <div className="space-y-4">
        <h3 className="font-semibold text-lg">Guest Information</h3>
        
        <div>
          <label className="label" htmlFor="guestName">
            <span className="label-text">Full Name *</span>
          </label>
          <input
            id="guestName"
            type="text"
            className={`input input-bordered w-full ${errors.guestName ? 'input-error' : ''}`}
            placeholder="John Doe"
            {...register('guestName')}
          />
          {errors.guestName && (
            <label className="label">
              <span className="label-text-alt text-error">{errors.guestName.message}</span>
            </label>
          )}
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="label" htmlFor="guestEmail">
              <span className="label-text">Email</span>
            </label>
            <input
              id="guestEmail"
              type="email"
              className={`input input-bordered w-full ${errors.guestEmail ? 'input-error' : ''}`}
              placeholder="john@example.com"
              {...register('guestEmail')}
            />
            {errors.guestEmail && (
              <label className="label">
                <span className="label-text-alt text-error">{errors.guestEmail.message}</span>
              </label>
            )}
          </div>

          <div>
            <label className="label" htmlFor="guestPhone">
              <span className="label-text">Phone *</span>
            </label>
            <input
              id="guestPhone"
              type="tel"
              className={`input input-bordered w-full ${errors.guestPhone ? 'input-error' : ''}`}
              placeholder="+264 81 234 5678"
              {...register('guestPhone')}
            />
            {errors.guestPhone && (
              <label className="label">
                <span className="label-text-alt text-error">{errors.guestPhone.message}</span>
              </label>
            )}
          </div>
        </div>
      </div>

      {/* Booking Details */}
      <div className="space-y-4">
        <h3 className="font-semibold text-lg">Booking Details</h3>
        
        <div>
          <label className="label" htmlFor="roomId">
            <span className="label-text">Room *</span>
          </label>
          <select
            id="roomId"
            className={`select select-bordered w-full ${errors.roomId ? 'select-error' : ''}`}
            {...register('roomId')}
          >
            <option value="">Select a room...</option>
            {/* TODO: Populate with available rooms from API */}
          </select>
          {errors.roomId && (
            <label className="label">
              <span className="label-text-alt text-error">{errors.roomId.message}</span>
            </label>
          )}
          <label className="label">
            <span className="label-text-alt">Check room availability before selecting</span>
          </label>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <div>
            <label className="label" htmlFor="checkInDate">
              <span className="label-text">Check-In *</span>
            </label>
            <input
              id="checkInDate"
              type="date"
              className={`input input-bordered w-full ${errors.checkInDate ? 'input-error' : ''}`}
              {...register('checkInDate')}
            />
            {errors.checkInDate && (
              <label className="label">
                <span className="label-text-alt text-error">{errors.checkInDate.message}</span>
              </label>
            )}
          </div>

          <div>
            <label className="label" htmlFor="checkOutDate">
              <span className="label-text">Check-Out *</span>
            </label>
            <input
              id="checkOutDate"
              type="date"
              className={`input input-bordered w-full ${errors.checkOutDate ? 'input-error' : ''}`}
              {...register('checkOutDate')}
            />
            {errors.checkOutDate && (
              <label className="label">
                <span className="label-text-alt text-error">{errors.checkOutDate.message}</span>
              </label>
            )}
          </div>

          <div>
            <label className="label" htmlFor="numberOfGuests">
              <span className="label-text">Guests *</span>
            </label>
            <input
              id="numberOfGuests"
              type="number"
              min="1"
              className={`input input-bordered w-full ${errors.numberOfGuests ? 'input-error' : ''}`}
              {...register('numberOfGuests')}
            />
            {errors.numberOfGuests && (
              <label className="label">
                <span className="label-text-alt text-error">{errors.numberOfGuests.message}</span>
              </label>
            )}
          </div>
        </div>
      </div>

      {/* Payment Information */}
      <div className="space-y-4">
        <h3 className="font-semibold text-lg">Payment</h3>
        
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="label" htmlFor="paymentMethod">
              <span className="label-text">Payment Method *</span>
            </label>
            <select
              id="paymentMethod"
              className={`select select-bordered w-full ${errors.paymentMethod ? 'select-error' : ''}`}
              {...register('paymentMethod')}
            >
              <option value="cash">Cash</option>
              <option value="card">Card</option>
              <option value="namqr">NamQR</option>
              <option value="corporate">Corporate Account</option>
            </select>
            {errors.paymentMethod && (
              <label className="label">
                <span className="label-text-alt text-error">{errors.paymentMethod.message}</span>
              </label>
            )}
          </div>

          <div>
            <label className="label" htmlFor="totalAmount">
              <span className="label-text">Total Amount (NAD) *</span>
            </label>
            <input
              id="totalAmount"
              type="number"
              step="0.01"
              min="0"
              className={`input input-bordered w-full ${errors.totalAmount ? 'input-error' : ''}`}
              placeholder="0.00"
              {...register('totalAmount')}
            />
            {errors.totalAmount && (
              <label className="label">
                <span className="label-text-alt text-error">{errors.totalAmount.message}</span>
              </label>
            )}
          </div>
        </div>
      </div>

      {/* Optional: Introducer Code */}
      <div className="space-y-4">
        <h3 className="font-semibold text-lg">Additional Information</h3>
        
        <div>
          <label className="label" htmlFor="introducerCode">
            <span className="label-text">Introducer Code (Optional)</span>
          </label>
          <div className="flex gap-2">
            <input
              id="introducerCode"
              type="text"
              className={`input input-bordered flex-1 ${introducerValidated ? 'input-success' : ''}`}
              placeholder="Enter introducer code..."
              {...register('introducerCode')}
            />
            <button
              type="button"
              className="btn btn-outline"
              onClick={validateIntroducer}
              disabled={!introducerCode || introducerCode.trim() === ''}
            >
              Validate
            </button>
          </div>
          {introducerValidated && (
            <label className="label">
              <span className="label-text-alt text-success">✓ Valid introducer code</span>
            </label>
          )}
        </div>

        <div>
          <label className="label" htmlFor="notes">
            <span className="label-text">Notes</span>
          </label>
          <textarea
            id="notes"
            className="textarea textarea-bordered w-full"
            rows={3}
            placeholder="Any special requests or notes..."
            {...register('notes')}
          />
        </div>
      </div>

      {/* Submit Button */}
      <div className="flex gap-3 pt-4">
        <button
          type="submit"
          className="btn btn-primary flex-1"
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <>
              <span className="loading loading-spinner loading-sm"></span>
              Creating Booking...
            </>
          ) : (
            'Create Walk-In Booking'
          )}
        </button>
        <button
          type="button"
          className="btn btn-ghost"
          onClick={() => router.back()}
          disabled={isSubmitting}
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
