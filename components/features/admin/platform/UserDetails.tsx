/**
 * UserDetails Component
 *
 * Purpose: Render profile details for a single platform user.
 * Location: components/features/admin/platform/UserDetails.tsx
 */
import React from 'react';
import { Building2, Mail, UserCircle } from 'lucide-react';

interface UserDetailsProps {
  user: {
    email: string;
    firstName: string | null;
    lastName: string | null;
    role: string | null;
    status: string | null;
    emailVerified: boolean | null;
    phone: string | null;
    isPlatformAdmin: boolean | null;
    createdAt: Date | string | null;
    lastLoginAt: Date | string | null;
  };
  tenantName: string | null;
}

export default function UserDetails({ user, tenantName }: UserDetailsProps) {
  return (
    <div className="card bg-base-100">
      <div className="card-body">
        <h2 className="card-title text-xl mb-4">
          <UserCircle className="w-6 h-6" />
          Profile
        </h2>
        <dl className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <dt className="text-sm text-base-content/70 flex items-center gap-1">
              <Mail className="w-4 h-4" />
              Email
            </dt>
            <dd className="font-medium">{user.email}</dd>
          </div>
          <div>
            <dt className="text-sm text-base-content/70">Role</dt>
            <dd className="font-medium">{user.role ?? '—'}</dd>
          </div>
          <div>
            <dt className="text-sm text-base-content/70">Status</dt>
            <dd>
              <span className={`badge ${user.status === 'active' ? 'badge-success' : 'badge-warning'}`}>
                {user.status ?? '—'}
              </span>
            </dd>
          </div>
          <div>
            <dt className="text-sm text-base-content/70">Email verified</dt>
            <dd className="font-medium">{user.emailVerified ? 'Yes' : 'No'}</dd>
          </div>
          <div>
            <dt className="text-sm text-base-content/70 flex items-center gap-1">
              <Building2 className="w-4 h-4" />
              Tenant
            </dt>
            <dd className="font-medium">{tenantName ?? '—'}</dd>
          </div>
          <div>
            <dt className="text-sm text-base-content/70">Phone</dt>
            <dd className="font-medium">{user.phone ?? '—'}</dd>
          </div>
          <div>
            <dt className="text-sm text-base-content/70">Platform admin</dt>
            <dd className="font-medium">{user.isPlatformAdmin ? 'Yes' : 'No'}</dd>
          </div>
          <div>
            <dt className="text-sm text-base-content/70">Created</dt>
            <dd className="font-medium">
              {user.createdAt ? new Date(user.createdAt).toLocaleString() : '—'}
            </dd>
          </div>
          <div>
            <dt className="text-sm text-base-content/70">Last login</dt>
            <dd className="font-medium">
              {user.lastLoginAt ? new Date(user.lastLoginAt).toLocaleString() : 'Never'}
            </dd>
          </div>
        </dl>
      </div>
    </div>
  );
}
