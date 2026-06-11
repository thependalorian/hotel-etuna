'use client';

/**
 * StaffEditForm — edit existing staff member (compensation + employment).
 * Location: components/features/staff/StaffEditForm.tsx
 */

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

interface StaffEditFormProps {
  staff: Staff;
}

export default function StaffEditForm({ staff }: StaffEditFormProps) {
  const router = useRouter();
  const [properties, setProperties] = useState<Property[]>([]);

  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
  } = useForm<StaffFormData>({
    resolver: zodResolver(createStaffSchema),
    defaultValues: {
      propertyId: staff.propertyId ?? undefined,
      firstName: staff.firstName,
      lastName: staff.lastName,
      email: staff.email ?? undefined,
      phone: staff.phone ?? undefined,
      position: staff.position,
      department: staff.department ?? undefined,
      hireDate: staff.hireDate ? new Date(staff.hireDate) : new Date(),
      employmentType: staff.employmentType ?? EmploymentType.FULL_TIME,
      status: staff.status ?? StaffStatus.ACTIVE,
      salary: staff.salary ? Number(staff.salary) : undefined,
      currency: staff.currency ?? 'NAD',
    },
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
      const response = await fetch(apiUrl(`/api/staff/${staff.id}`), {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error('Failed to update staff member');
      }

      router.push(`/staff/${staff.id}`);
      router.refresh();
    } catch (error) {
      securityLogger.error('[StaffEditForm] submit error', error);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div>
        <h3 className="text-xl font-semibold font-display mb-4">Personal Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="form-control">
            <label className="label"><span className="label-text font-medium">First Name</span></label>
            <input type="text" {...register('firstName')} className={`input input-bordered min-h-[44px] ${errors.firstName ? 'input-error' : ''}`} />
          </div>
          <div className="form-control">
            <label className="label"><span className="label-text font-medium">Last Name</span></label>
            <input type="text" {...register('lastName')} className={`input input-bordered min-h-[44px] ${errors.lastName ? 'input-error' : ''}`} />
          </div>
          <div className="form-control">
            <label className="label"><span className="label-text font-medium">Email</span></label>
            <input type="email" {...register('email')} className="input input-bordered min-h-[44px]" />
          </div>
          <div className="form-control">
            <label className="label"><span className="label-text font-medium">Phone</span></label>
            <input type="tel" {...register('phone')} className="input input-bordered min-h-[44px]" />
          </div>
        </div>
      </div>

      <div className="divider" />

      <div>
        <h3 className="text-xl font-semibold font-display mb-4">Employment &amp; Pay</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="form-control">
            <label className="label"><span className="label-text font-medium">Position</span></label>
            <input type="text" {...register('position')} className="input input-bordered min-h-[44px]" />
          </div>
          <div className="form-control">
            <label className="label"><span className="label-text font-medium">Department</span></label>
            <input type="text" {...register('department')} className="input input-bordered min-h-[44px]" />
          </div>
          <div className="form-control">
            <label className="label"><span className="label-text font-medium">Monthly Salary (NAD)</span></label>
            <input type="number" step="0.01" {...register('salary', { valueAsNumber: true })} className="input input-bordered min-h-[44px]" />
          </div>
          <div className="form-control">
            <label className="label"><span className="label-text font-medium">Property</span></label>
            <Controller
              name="propertyId"
              control={control}
              render={({ field }) => (
                <select {...field} className="select select-bordered min-h-[44px]">
                  <option value="">Select a property</option>
                  {properties.map((property) => (
                    <option key={property.id} value={property.id}>{property.name}</option>
                  ))}
                </select>
              )}
            />
          </div>
          <div className="form-control">
            <label className="label"><span className="label-text font-medium">Employment Type</span></label>
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
            <label className="label"><span className="label-text font-medium">Status</span></label>
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

      <div className="flex justify-end gap-2 pt-4">
        <button type="button" className="btn btn-ghost rounded-full px-6" onClick={() => router.back()}>
          Cancel
        </button>
        <button type="submit" className="btn btn-primary rounded-full px-6 min-h-[44px]" disabled={isSubmitting}>
          {isSubmitting ? <><LoadingSpinner size="sm" /> Saving…</> : 'Save Changes'}
        </button>
      </div>
    </form>
  );
}
