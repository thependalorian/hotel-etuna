/**
 * TenantDetails Component
 *
 * Purpose: Render tenant detail cards and metadata for platform admins.
 * Location: components/features/admin/platform/TenantDetails.tsx
 */
import React from 'react';
import { Home, Users } from 'lucide-react';

interface TenantDetailsProps {
  tenant: {
    name: string;
    subdomain: string | null;
    domain: string | null;
    status: string | null;
    propertyType: string | null;
    hasRestaurantFeatures: boolean | null;
    roomCount: number | null;
    createdAt: Date | string | null;
  };
  propertyCount: number;
  userCount: number;
}

export default function TenantDetails({ tenant, propertyCount, userCount }: TenantDetailsProps) {
  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="card bg-base-100">
          <div className="card-body">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-base-content/70 mb-1">Properties</p>
                <p className="text-2xl font-bold">{propertyCount}</p>
              </div>
              <Home className="w-10 h-10 text-primary opacity-20" />
            </div>
          </div>
        </div>
        <div className="card bg-base-100">
          <div className="card-body">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-base-content/70 mb-1">Users</p>
                <p className="text-2xl font-bold">{userCount}</p>
              </div>
              <Users className="w-10 h-10 text-primary opacity-20" />
            </div>
          </div>
        </div>
        <div className="card bg-base-100">
          <div className="card-body">
            <p className="text-sm text-base-content/70 mb-1">Status</p>
            <span
              className={`badge badge-lg ${
                tenant.status === 'active'
                  ? 'badge-success'
                  : tenant.status === 'suspended'
                    ? 'badge-warning'
                    : 'badge-ghost'
              }`}
            >
              {tenant.status ?? '—'}
            </span>
          </div>
        </div>
      </div>

      <div className="card bg-base-100">
        <div className="card-body">
          <h2 className="card-title text-xl mb-4">Tenant Info</h2>
          <dl className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <dt className="text-sm text-base-content/70">Subdomain</dt>
              <dd className="font-medium">{tenant.subdomain ?? '—'}</dd>
            </div>
            <div>
              <dt className="text-sm text-base-content/70">Domain</dt>
              <dd className="font-medium">{tenant.domain ?? '—'}</dd>
            </div>
            <div>
              <dt className="text-sm text-base-content/70">Property type</dt>
              <dd className="font-medium">{tenant.propertyType ?? '—'}</dd>
            </div>
            <div>
              <dt className="text-sm text-base-content/70">Restaurant features</dt>
              <dd className="font-medium">{tenant.hasRestaurantFeatures ? 'Yes' : 'No'}</dd>
            </div>
            <div>
              <dt className="text-sm text-base-content/70">Room count</dt>
              <dd className="font-medium">{tenant.roomCount ?? 0}</dd>
            </div>
            <div>
              <dt className="text-sm text-base-content/70">Created</dt>
              <dd className="font-medium">
                {tenant.createdAt ? new Date(tenant.createdAt).toLocaleString() : '—'}
              </dd>
            </div>
          </dl>
        </div>
      </div>
    </>
  );
}
