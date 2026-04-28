'use client';

import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { createPropertySchema } from '@/lib/utils/validation';
import type { Property } from '@/lib/db/schema';
import { z } from 'zod';
import { useRouter } from 'next/navigation';
import LoadingSpinner from '@/components/shared/LoadingSpinner';
import ErrorDisplay from '@/components/shared/ErrorDisplay';
import { apiUrl } from '@/lib/utils/api-url';
import { cn } from '@/lib/utils/cn';

type FormData = z.infer<typeof createPropertySchema>;

type PropertyFormProps = {
  property?: Property;
};

const PropertyForm = ({ property }: PropertyFormProps) => {
  const router = useRouter();
  const [error, setError] = React.useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(createPropertySchema),
    defaultValues: property
      ? {
          name: property.name,
          type: String(property.type).toLowerCase() as FormData['type'],
          description: property.description || '',
          address: property.address || '',
          city: property.city || '',
          country: property.country || '',
          postalCode: property.postalCode || '',
          roomCount: property.roomCount ?? undefined,
          amenities: property.amenities ?? undefined,
          images: property.images ?? undefined,
          checkInTime: property.checkInTime ?? '',
          checkOutTime: property.checkOutTime ?? '',
        }
      : {
          name: '',
          type: 'hotel',
          description: '',
          address: '',
          city: '',
          country: 'Namibia',
          postalCode: '',
          roomCount: undefined,
          amenities: undefined,
          images: undefined,
          checkInTime: '',
          checkOutTime: '',
        },
  });

  const inputClass = (invalid?: boolean) =>
    cn(
      'w-full min-h-[44px] rounded-xl border bg-white/95 px-3.5 py-2.5 text-sm text-ink-900 shadow-xs transition-all duration-200',
      'placeholder:text-ink-400 hover:border-brand-300 focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-500/20',
      invalid ? 'border-error focus:ring-error/25' : 'border-base-300'
    );

  const labelClass = 'mb-1.5 block text-sm font-semibold text-ink-800';

  const onSubmit = async (data: FormData) => {
    try {
      const url = property ? `/api/properties/${property.id}` : '/api/properties';
      const method = property ? 'PUT' : 'POST';

      const response = await fetch(apiUrl(url), {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error(property ? 'Failed to update property' : 'Failed to create property');
      }

      router.push('/properties');
      router.refresh();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An error occurred while saving the property';
      setError(errorMessage);
    }
  };

  const onDelete = async () => {
    if (!property) return;

    if (confirm('Are you sure you want to delete this property?')) {
      try {
        const response = await fetch(apiUrl(`/api/properties/${property.id}`), {
          method: 'DELETE',
        });

        if (!response.ok) {
          throw new Error('Failed to delete property');
        }

        router.push('/properties');
        router.refresh();
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'An error occurred while deleting the property';
        setError(errorMessage);
      }
    }
  };

  return (
    <div className="space-y-6">
      {error && (
        <ErrorDisplay
          error={error}
          title="Property Operation Failed"
          onRetry={() => setError(null)}
        />
      )}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
        <div className="rounded-lg border border-nude-200 bg-surface-elevated shadow-nude-soft p-6 md:p-8">
          {!property && (
            <p className="text-xs font-bold text-nude-600 uppercase tracking-wider mb-3">Property Details</p>
          )}
          <h3 className="font-display text-2xl font-bold text-nude-900 mb-2">
            {property ? 'Edit Property' : 'Create New Property'}
          </h3>
          {!property && (
            <p className="mt-2 max-w-2xl text-sm text-nude-600 leading-relaxed">
              This information feeds your property profile, bookings, and Sofia—keep it accurate; you can refine
              more later.
            </p>
          )}

          <div className="mt-6 grid grid-cols-1 gap-5 md:grid-cols-2">
            <div className="md:col-span-2">
              <label className={labelClass} htmlFor="property-name">
                Property name
              </label>
              <input
                id="property-name"
                type="text"
                {...register('name')}
                className={inputClass(!!errors.name)}
                placeholder="e.g. Atlantic View Lodge"
                autoComplete="organization"
              />
              {errors.name && (
                <p className="mt-1.5 text-sm font-medium text-error">{errors.name.message}</p>
              )}
            </div>

            <div>
              <label className={labelClass} htmlFor="property-type">
                Property type
              </label>
              <select
                id="property-type"
                {...register('type')}
                className={inputClass(!!errors.type)}
              >
                {['hotel', 'restaurant', 'lodge', 'airbnb', 'both'].map((type) => (
                  <option key={type} value={type}>
                    {type === 'airbnb' ? 'Airbnb' : type === 'both' ? 'Hotel & restaurant' : type.charAt(0).toUpperCase() + type.slice(1)}
                  </option>
                ))}
              </select>
              {errors.type && (
                <p className="mt-1.5 text-sm font-medium text-error">{errors.type.message}</p>
              )}
            </div>

            <div>
              <label className={labelClass} htmlFor="property-rooms">
                Room count <span className="font-normal text-ink-500">(optional)</span>
              </label>
              <input
                id="property-rooms"
                type="number"
                {...register('roomCount', {
                  setValueAs: (v) => (v === '' || v === null || Number.isNaN(Number(v)) ? undefined : Number(v)),
                })}
                className={inputClass(!!errors.roomCount)}
                placeholder="0"
                min={0}
              />
              {errors.roomCount && (
                <p className="mt-1.5 text-sm font-medium text-error">{errors.roomCount.message}</p>
              )}
            </div>

            <div className="md:col-span-2">
              <label className={labelClass} htmlFor="property-address">
                Street address
              </label>
              <input
                id="property-address"
                type="text"
                {...register('address')}
                className={inputClass(!!errors.address)}
                placeholder="Street, area, city"
                autoComplete="street-address"
              />
              {errors.address && (
                <p className="mt-1.5 text-sm font-medium text-error">{errors.address.message}</p>
              )}
            </div>

            <div className="md:col-span-2">
              <label className={labelClass} htmlFor="property-description">
                Description <span className="font-normal text-ink-500">(optional)</span>
              </label>
              <textarea
                id="property-description"
                {...register('description')}
                className={cn(inputClass(!!errors.description), 'min-h-[128px] resize-y py-3')}
                placeholder="Short summary for your team and guests (amenities, vibe, location notes)…"
                rows={4}
              />
              {errors.description && (
                <p className="mt-1.5 text-sm font-medium text-error">{errors.description.message}</p>
              )}
            </div>
          </div>
        </div>

        <div className="flex flex-col-reverse gap-4 border-t border-nude-200 pt-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            {property && (
              <button
                type="button"
                onClick={onDelete}
                className="inline-flex items-center gap-2 px-6 py-3 bg-semantic-error text-white rounded-lg font-semibold hover:bg-semantic-error-dark transition-all duration-200 min-h-[52px] w-full sm:w-auto"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                Delete Property
              </button>
            )}
          </div>
          <button
            type="submit"
            className="inline-flex items-center gap-2 px-8 py-3 bg-luxury-charlotte text-white rounded-lg font-semibold hover:bg-luxury-bronze shadow-luxury-soft hover:shadow-luxury-medium transition-all duration-200 min-h-[52px] w-full sm:w-auto"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <LoadingSpinner size="sm" />
                {property ? 'Saving Changes…' : 'Creating Property…'}
              </>
            ) : (
              <>
                {property ? 'Save Changes' : 'Create Property'}
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default PropertyForm;