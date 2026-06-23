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
          name: 'Hotel Etuna',
          type: 'hotel',
          description: '',
          address: '5544 Valley Street, Ongwediva, Namibia',
          city: 'Ongwediva',
          country: 'Namibia',
          postalCode: '',
          roomCount: 35,
          amenities: undefined,
          images: undefined,
          checkInTime: '14:00',
          checkOutTime: '11:00',
        },
  });

  const inputClass = (invalid?: boolean) =>
    cn(
      'w-full min-h-[44px] rounded-etuna-card border bg-white/95 px-3.5 py-2.5 text-sm text-ink-900 shadow-xs transition-all duration-200',
      'placeholder:text-ink-500 focus:border-ci-primary focus:outline-none focus:ring-2 focus:ring-ci-primary/20',
      invalid ? 'border-semantic-error focus:ring-semantic-error/25' : 'border-nude-200'
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
        throw new Error(property ? 'Failed to update property details' : 'Failed to save property details');
      }

      router.push('/properties');
      router.refresh();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An error occurred while saving';
      setError(errorMessage);
    }
  };

  return (
    <div className="space-y-6">
      {error && (
        <ErrorDisplay
          error={error}
          title="Save Failed"
          onRetry={() => setError(null)}
        />
      )}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
        <div className="rounded-etuna-input border border-nude-200 bg-surface-elevated p-6 md:p-8">
          <h3 className="font-display text-2xl font-bold text-ink-900 mb-2">
            {property ? 'Edit Property Details' : 'Configure Hotel Etuna'}
          </h3>
          {!property && (
            <p className="mt-2 max-w-2xl text-sm text-ink-600 leading-relaxed">
              Set up your property details so your team can manage rooms, bookings, and services.
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
                placeholder="Hotel Etuna"
                autoComplete="organization"
              />
              {errors.name && (
                <p className="mt-1.5 text-sm font-medium text-semantic-error">{errors.name.message}</p>
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
                {['hotel', 'restaurant', 'lodge', 'both'].map((type) => (
                  <option key={type} value={type}>
                    {type === 'both' ? 'Hotel & restaurant' : type.charAt(0).toUpperCase() + type.slice(1)}
                  </option>
                ))}
              </select>
              {errors.type && (
                <p className="mt-1.5 text-sm font-medium text-semantic-error">{errors.type.message}</p>
              )}
            </div>

            <div>
              <label className={labelClass} htmlFor="property-rooms">
                Room count <span className="font-normal text-ink-500">(35 for Hotel Etuna)</span>
              </label>
              <input
                id="property-rooms"
                type="number"
                {...register('roomCount', {
                  setValueAs: (v) => (v === '' || v === null || Number.isNaN(Number(v)) ? undefined : Number(v)),
                })}
                className={inputClass(!!errors.roomCount)}
                placeholder="35"
                min={0}
              />
              {errors.roomCount && (
                <p className="mt-1.5 text-sm font-medium text-semantic-error">{errors.roomCount.message}</p>
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
                placeholder="5544 Valley Street, Ongwediva"
                autoComplete="street-address"
              />
              {errors.address && (
                <p className="mt-1.5 text-sm font-medium text-semantic-error">{errors.address.message}</p>
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
                placeholder="Describe Hotel Etuna's amenities, atmosphere, and location..."
                rows={4}
              />
              {errors.description && (
                <p className="mt-1.5 text-sm font-medium text-semantic-error">{errors.description.message}</p>
              )}
            </div>
          </div>
        </div>

        <div className="flex flex-col-reverse gap-4 border-t border-nude-200 pt-6 sm:flex-row sm:items-center sm:justify-between">
          <button
            type="submit"
            className="inline-flex items-center gap-2 px-8 py-3 bg-ci-primary text-ci-cream rounded-full font-bold hover:bg-ci-primary/90 shadow-nude-soft transition-all duration-200 min-h-[52px] w-full sm:w-auto"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <LoadingSpinner size="sm" />
                Saving…
              </>
            ) : (
              <>
                {property ? 'Save Changes' : 'Save Property'}
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default PropertyForm;
