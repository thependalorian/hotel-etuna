'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useRouter, useSearchParams } from 'next/navigation';
import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/Form';
import LoadingSpinner from '@/components/shared/LoadingSpinner';
import { apiUrl } from '@/lib/utils/api-url';

const formSchema = z.object({
  checkInDate: z.string().nonempty({ message: 'Check-in date is required.' }),
  checkOutDate: z.string().nonempty({ message: 'Check-out date is required.' }),
  numGuests: z.number().min(1, { message: 'At least one guest is required.' }),
});

export function BookingForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const roomId = searchParams.get('roomId');
  const [error, setError] = useState<string | null>(null);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      checkInDate: '',
      checkOutDate: '',
      numGuests: 1,
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setError(null);
    if (!roomId) {
      setError('Room ID is missing. Please go back and select a room.');
      return;
    }

    try {
      const response = await fetch(apiUrl('/api/bookings'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ ...values, roomId }),
      });

      if (!response.ok) {
        const data = await response.json();
        setError(data.message || 'An error occurred while creating the booking.');
        return;
      }

      const newBooking = await response.json();
      // Redirect to a confirmation page or the user's dashboard
      router.push(`/bookings/${newBooking.id}`);

    } catch {
      setError('An unexpected error occurred. Please try again.');
    }
  }

  return (
    <div className="w-full max-w-2xl">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {error && (
            <div className="flex items-start gap-3 p-4 bg-semantic-error-light text-semantic-error-dark rounded-lg border border-semantic-error/20 animate-slide-down">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="text-sm font-medium">{error}</span>
            </div>
          )}
          {roomId && (
            <div className="flex items-start gap-3 p-4 bg-semantic-info-light text-semantic-info-dark rounded-lg border border-semantic-info/20 animate-slide-down">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="text-sm font-semibold">Booking for Room ID: {roomId}</span>
            </div>
          )}
          
          {/* Form Sections with clear labels */}
          <div className="space-y-4">
            <h3 className="font-display text-lg font-semibold text-nude-900">Booking Details</h3>
            
            <FormField
              control={form.control}
              name="checkInDate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-nude-700 font-semibold">Check-in Date</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
                  </FormControl>
                  <FormMessage className="text-semantic-error text-sm" />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="checkOutDate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-nude-700 font-semibold">Check-out Date</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
                  </FormControl>
                  <FormMessage className="text-semantic-error text-sm" />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="numGuests"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-nude-700 font-semibold">Number of Guests</FormLabel>
                  <FormControl>
                    <Input type="number" min="1" {...field} onChange={e => field.onChange(parseInt(e.target.value, 10))} />
                  </FormControl>
                  <FormMessage className="text-semantic-error text-sm" />
                </FormItem>
              )}
            />
          </div>

          <div className="flex justify-end gap-3 pt-6 border-t border-nude-200">
            <Button 
              type="submit" 
              variant="primary"
              size="lg"
              disabled={form.formState.isSubmitting}
              className="w-full sm:w-auto min-h-[56px] px-8 font-semibold shadow-nude-medium hover:shadow-nude-strong transition-all duration-200"
            >
              {form.formState.isSubmitting ? (
                <>
                  <LoadingSpinner size="sm" />
                  Creating Booking...
                </>
              ) : (
                <>
                  Confirm Booking
                  <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </>
              )}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}