'use client';

import React, { useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { createStaffSchema } from '@/lib/utils/validation';
import { z } from 'zod';
import { useRouter } from 'next/navigation';
import type { Property, Staff } from '@/lib/db/schema';
import { EmploymentType, StaffStatus } from '@/lib/db/schema';
import LoadingSpinner from '@/components/shared/LoadingSpinner';
import { apiUrl } from '@/lib/utils/api-url';
import { securityLogger } from '@/lib/utils/security-logger.client';

type StaffFormData = z.infer<typeof createStaffSchema>;

const StaffForm = () => {
  const router = useRouter();
  const [properties, setProperties] = useState<Property[]>([]);

  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
  } = useForm<StaffFormData>({
    resolver: zodResolver(createStaffSchema),
  });

  useEffect(() => {
    const fetchProperties = async () => {
      const response = await fetch(apiUrl('/api/properties'));
      const data = await response.json();
      setProperties(data);
    };
    fetchProperties();
  }, []);

  const onSubmit = async (data: StaffFormData) => {
    try {
      const response = await fetch(apiUrl('/api/staff'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error('Failed to create staff member');
      }

      router.push('/staff');
    } catch (error) {
      securityLogger.error("[StaffForm] submit error", error);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Personal Information */}
      <div>
        <h3 className="text-xl font-semibold font-display mb-4">Personal Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="form-control">
            <label className="label">
              <span className="label-text font-medium">First Name</span>
            </label>
            <input 
              type="text" 
              {...register('firstName')} 
              className={`input input-bordered min-h-[44px] ${errors.firstName ? 'input-error' : ''}`} 
            />
            {errors.firstName && <p className="text-error text-sm mt-1">{errors.firstName.message}</p>}
          </div>
          <div className="form-control">
            <label className="label">
              <span className="label-text font-medium">Last Name</span>
            </label>
            <input 
              type="text" 
              {...register('lastName')} 
              className={`input input-bordered min-h-[44px] ${errors.lastName ? 'input-error' : ''}`} 
            />
            {errors.lastName && <p className="text-error text-sm mt-1">{errors.lastName.message}</p>}
          </div>
          <div className="form-control">
            <label className="label">
              <span className="label-text font-medium">Email</span>
            </label>
            <input 
              type="email" 
              {...register('email')} 
              className={`input input-bordered min-h-[44px] ${errors.email ? 'input-error' : ''}`} 
            />
            {errors.email && <p className="text-error text-sm mt-1">{errors.email.message}</p>}
          </div>
          <div className="form-control">
            <label className="label">
              <span className="label-text font-medium">Phone</span>
            </label>
            <input 
              type="tel" 
              {...register('phone')} 
              className="input input-bordered min-h-[44px]" 
            />
          </div>
        </div>
      </div>

      <div className="divider"></div>

      {/* Employment Information */}
      <div>
        <h3 className="text-xl font-semibold font-display mb-4">Employment Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="form-control">
            <label className="label">
              <span className="label-text font-medium">Position</span>
            </label>
            <input 
              type="text" 
              {...register('position')} 
              className={`input input-bordered min-h-[44px] ${errors.position ? 'input-error' : ''}`} 
            />
            {errors.position && <p className="text-error text-sm mt-1">{errors.position.message}</p>}
          </div>
          <div className="form-control">
            <label className="label">
              <span className="label-text font-medium">Department</span>
            </label>
            <input 
              type="text" 
              {...register('department')} 
              className="input input-bordered min-h-[44px]" 
            />
          </div>
          <div className="form-control">
            <label className="label">
              <span className="label-text font-medium">Hire Date</span>
            </label>
            <input 
              type="date" 
              {...register('hireDate')} 
              className={`input input-bordered min-h-[44px] ${errors.hireDate ? 'input-error' : ''}`} 
            />
            {errors.hireDate && <p className="text-error text-sm mt-1">{errors.hireDate.message}</p>}
          </div>
          <div className="form-control">
            <label className="label">
              <span className="label-text font-medium">Property</span>
            </label>
            <Controller
              name="propertyId"
              control={control}
              render={({ field }) => (
                <select {...field} className={`select select-bordered min-h-[44px] ${errors.propertyId ? 'select-error' : ''}`}>
                  <option value="">Select a property</option>
                  {properties.map((property) => (
                    <option key={property.id} value={property.id}>
                      {property.name}
                    </option>
                  ))}
                </select>
              )}
            />
            {errors.propertyId && <p className="text-error text-sm mt-1">{errors.propertyId.message}</p>}
          </div>
          <div className="form-control">
            <label className="label">
              <span className="label-text font-medium">Employment Type</span>
            </label>
            <Controller
              name="employmentType"
              control={control}
              render={({ field }) => (
                <select {...field} className="select select-bordered min-h-[44px]">
                  {Object.values(EmploymentType).map((type) => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              )}
            />
          </div>
          <div className="form-control">
            <label className="label">
              <span className="label-text font-medium">Status</span>
            </label>
            <Controller
              name="status"
              control={control}
              render={({ field }) => (
                <select {...field} className="select select-bordered min-h-[44px]">
                  {Object.values(StaffStatus).map((status) => (
                    <option key={status} value={status}>{status}</option>
                  ))}
                </select>
              )}
            />
          </div>
        </div>
      </div>

      <div className="flex justify-end pt-4">
        <button 
          type="submit" 
          className="btn btn-primary gentle-lift min-h-[44px]" 
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <>
              <LoadingSpinner size="sm" />
              Creating...
            </>
          ) : (
            'Create Staff Member'
          )}
        </button>
      </div>
    </form>
  );
};

export default StaffForm;
