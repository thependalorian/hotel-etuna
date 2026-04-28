/**
 * PropertyDetails Component
 *
 * Purpose: Render detailed metadata for a single property.
 * Location: components/features/admin/platform/PropertyDetails.tsx
 */
import React from 'react';
import { Building2, Home } from 'lucide-react';

interface PropertyDetailsProps {
  property: {
    slug: string;
    description: string | null;
    type: string | null;
    status: string | null;
    currency: string | null;
    timezone: string | null;
    hasRestaurantFeatures: boolean | null;
    createdAt: Date | string | null;
  };
  tenantName: string | null;
  roomCount: number;
}

export default function PropertyDetails({ property, tenantName, roomCount }: PropertyDetailsProps) {
  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="stat bg-base-100 rounded-lg shadow">
          <div className="stat-title">Rooms</div>
          <div className="stat-value text-primary">{roomCount}</div>
        </div>
        <div className="stat bg-base-100 rounded-lg shadow">
          <div className="stat-title">Type</div>
          <div className="stat-value text-lg">{property.type ?? '—'}</div>
        </div>
        <div className="stat bg-base-100 rounded-lg shadow">
          <div className="stat-title">Status</div>
          <div className="stat-value text-lg">{property.status ?? '—'}</div>
        </div>
      </div>

      <div className="card bg-base-100 shadow-lg">
        <div className="card-body">
          <h2 className="card-title text-xl mb-4">
            <Home className="w-6 h-6" />
            Property
          </h2>
          <dl className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <dt className="text-sm text-base-content/70">Slug</dt>
              <dd className="font-medium">{property.slug}</dd>
            </div>
            <div>
              <dt className="text-sm text-base-content/70 flex items-center gap-1">
                <Building2 className="w-4 h-4" />
                Tenant
              </dt>
              <dd className="font-medium">{tenantName ?? '—'}</dd>
            </div>
            <div>
              <dt className="text-sm text-base-content/70">Currency</dt>
              <dd className="font-medium">{property.currency ?? '—'}</dd>
            </div>
            <div>
              <dt className="text-sm text-base-content/70">Timezone</dt>
              <dd className="font-medium">{property.timezone ?? '—'}</dd>
            </div>
            <div className="md:col-span-2">
              <dt className="text-sm text-base-content/70">Description</dt>
              <dd className="font-medium whitespace-pre-wrap">{property.description ?? '—'}</dd>
            </div>
            <div>
              <dt className="text-sm text-base-content/70">Restaurant features</dt>
              <dd className="font-medium">{property.hasRestaurantFeatures ? 'Yes' : 'No'}</dd>
            </div>
            <div>
              <dt className="text-sm text-base-content/70">Created</dt>
              <dd className="font-medium">
                {property.createdAt ? new Date(property.createdAt).toLocaleString() : '—'}
              </dd>
            </div>
          </dl>
        </div>
      </div>
    </>
  );
}
