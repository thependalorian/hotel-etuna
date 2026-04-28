/**
 * Admin Dashboard Page
 * 
 * Purpose: System administration and management interface
 * Location: app/(dashboard)/admin/page.tsx
 * 
 * Features:
 * - System settings
 * - User management
 * - Tenant management
 * - System health monitoring
 */

import React from 'react';
import { getSessionWithTenantContext } from '@/lib/auth/tenant-context';
import { redirect } from 'next/navigation';
import ErrorDisplay from '@/components/shared/ErrorDisplay';
import Link from 'next/link';

export default async function AdminPage() {
  const session = await getSessionWithTenantContext();
  
  // Role-based access control
  if (!session?.user) {
    redirect('/login?callbackUrl=/admin');
  }
  
  if (session.user.role !== 'admin' && session.user.role !== 'super-admin') {
    return (
      <div className="flex items-center justify-center min-h-64">
        <ErrorDisplay
          error="You do not have permission to access this page."
          title="Access Denied"
        />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="buffr-page-title mb-2">Administration</h1>
          <p className="text-base-content/70">System administration and management</p>
        </div>
      </div>

      {/* Admin Content */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* System Settings Card */}
        <div className="card bg-base-100 shadow-lg card-hover">
          <div className="card-body">
            <h2 className="card-title text-xl font-display">System Settings</h2>
            <p className="text-base-content/70">Configure system-wide settings and preferences</p>
            <div className="card-actions justify-end mt-4">
              <Link
                href="/admin/platform/settings"
                className="btn btn-primary btn-sm min-h-[44px]"
                aria-label="Configure system settings"
              >
                Configure
              </Link>
            </div>
          </div>
        </div>

        {/* User Management Card */}
        <div className="card bg-base-100 shadow-lg card-hover">
          <div className="card-body">
            <h2 className="card-title text-xl font-display">User Management</h2>
            <p className="text-base-content/70">Manage users, roles, and permissions</p>
            <div className="card-actions justify-end mt-4">
              <Link
                href="/admin/platform/users"
                className="btn btn-primary btn-sm min-h-[44px]"
                aria-label="Manage users, roles, and permissions"
              >
                Manage Users
              </Link>
            </div>
          </div>
        </div>

        {/* Tenant Management Card */}
        <div className="card bg-base-100 shadow-lg card-hover">
          <div className="card-body">
            <h2 className="card-title text-xl font-display">Tenant Management</h2>
            <p className="text-base-content/70">Manage tenants and organizations</p>
            <div className="card-actions justify-end mt-4">
              <Link
                href="/admin/platform/tenants"
                className="btn btn-primary btn-sm min-h-[44px]"
                aria-label="Manage tenants and organizations"
              >
                Manage Tenants
              </Link>
            </div>
          </div>
        </div>

        {/* System Health Card */}
        <div className="card bg-base-100 shadow-lg card-hover">
          <div className="card-body">
            <h2 className="card-title text-xl font-display">System Health</h2>
            <p className="text-base-content/70">Monitor system performance and health</p>
            <div className="card-actions justify-end mt-4">
              <Link
                href="/admin/platform"
                className="btn btn-primary btn-sm min-h-[44px]"
                aria-label="View system health and performance"
              >
                View Health
              </Link>
            </div>
          </div>
        </div>

        {/* Analytics Card */}
        <div className="card bg-base-100 shadow-lg card-hover">
          <div className="card-body">
            <h2 className="card-title text-xl font-display">System Analytics</h2>
            <p className="text-base-content/70">View system-wide analytics and metrics</p>
            <div className="card-actions justify-end mt-4">
              <Link
                href="/admin/platform/analytics"
                className="btn btn-primary btn-sm min-h-[44px]"
                aria-label="View system-wide analytics"
              >
                View Analytics
              </Link>
            </div>
          </div>
        </div>

        {/* Audit Logs Card */}
        <div className="card bg-base-100 shadow-lg card-hover">
          <div className="card-body">
            <h2 className="card-title text-xl font-display">Audit Logs</h2>
            <p className="text-base-content/70">View system audit trails and logs</p>
            <div className="card-actions justify-end mt-4">
              <Link
                href="/admin/platform/audit"
                className="btn btn-primary btn-sm min-h-[44px]"
                aria-label="View system audit trails and logs"
              >
                View Logs
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Coming Soon Notice */}
      <div className="alert alert-info">
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" className="stroke-current shrink-0 w-6 h-6">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
        </svg>
        <span>Use the linked administration sections to manage platform operations.</span>
      </div>
    </div>
  );
}
