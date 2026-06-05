/**
 * Tenant Management Component
 * 
 * Purpose: Component for managing tenants with CRUD operations
 * Location: components/features/admin/platform/TenantManagement.tsx
 * 
 * Features:
 * - List all tenants with search and filters
 * - Create, edit, suspend tenants
 * - View tenant statistics
 * 
 * Database: Uses Drizzle ORM data passed from server component
 */

'use client';

import { usePlatformToast } from '@/components/PlatformToastProvider';
import { apiUrl } from '@/lib/utils/api-url';
import {
  messageFromFailedResponse,
  networkErrorMessage,
  rateLimitMessage,
} from '@/lib/utils/api-error-message';
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import EmptyState from '@/components/shared/EmptyState';
import NoticeState from '@/components/shared/NoticeState';
import { Building2, Search, Plus, Eye, CheckCircle, XCircle } from 'lucide-react';
import { securityLogger } from '@/lib/utils/security-logger.client';

interface TenantWithCounts {
  id: string;
  name: string;
  subdomain: string | null;
  domain: string | null;
  status: string;
  room_count: number;
  property_type: string | null;
  has_restaurant_features: boolean;
  created_at: string;
  updated_at: string;
  user_count: number;
  property_count: number;
}

interface TenantManagementProps {
  tenants: TenantWithCounts[];
  userRole: string;
}

export default function TenantManagement({ tenants: initialTenants, userRole }: TenantManagementProps) {
  const router = useRouter();
  const { showToast } = usePlatformToast();
  const [tenants] = useState<TenantWithCounts[]>(initialTenants);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedTenant, setSelectedTenant] = useState<TenantWithCounts | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [mutatingTenantId, setMutatingTenantId] = useState<string | null>(null);

  const isSuperAdmin = userRole === 'super-admin';

  const handleStatusToggle = async (tenant: TenantWithCounts) => {
    const newStatus = tenant.status === 'active' ? 'suspended' : 'active';
    setMutatingTenantId(tenant.id);
    try {
      const response = await fetch(apiUrl(`/api/admin/platform/tenants/${tenant.id}`), {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ status: newStatus }),
      });

      if (response.ok) {
        showToast({
          variant: 'success',
          title: 'Tenant updated',
          message: `Status set to ${newStatus}.`,
        });
        router.refresh();
      } else {
        const msg =
          response.status === 429
            ? await rateLimitMessage(response)
            : await messageFromFailedResponse(response);
        showToast({ variant: 'error', title: 'Could not update tenant', message: msg });
      }
    } catch (error) {
      securityLogger.error('Error updating tenant status:', error);
      showToast({
        variant: 'error',
        title: 'Could not update tenant',
        message: networkErrorMessage(error),
      });
    } finally {
      setMutatingTenantId(null);
    }
  };

  const handleDeleteTenant = async (tenantId: string) => {
    if (!confirm('Are you sure you want to delete this tenant? This action cannot be undone.')) return;

    setMutatingTenantId(tenantId);
    try {
      const response = await fetch(apiUrl(`/api/admin/platform/tenants/${tenantId}`), {
        method: 'DELETE',
        credentials: 'include',
      });

      if (response.ok) {
        showToast({
          variant: 'success',
          title: 'Tenant deleted',
          message: 'The tenant has been removed.',
        });
        router.refresh();
      } else {
        const msg =
          response.status === 429
            ? await rateLimitMessage(response)
            : await messageFromFailedResponse(response);
        showToast({ variant: 'error', title: 'Could not delete tenant', message: msg });
      }
    } catch (error) {
      securityLogger.error('Error deleting tenant:', error);
      showToast({
        variant: 'error',
        title: 'Could not delete tenant',
        message: networkErrorMessage(error),
      });
    } finally {
      setMutatingTenantId(null);
    }
  };

  const filteredTenants = tenants.filter(tenant => {
    const matchesSearch = searchQuery === '' || 
      tenant.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (tenant.subdomain && tenant.subdomain.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesStatus = statusFilter === 'all' || tenant.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const tenantStats = {
    total: tenants.length,
    active: tenants.filter(t => t.status === 'active').length,
    suspended: tenants.filter(t => t.status === 'suspended').length,
    withRestaurant: tenants.filter(t => t.has_restaurant_features).length,
  };

  return (
    <div className="space-y-6">
      {!isSuperAdmin && (
        <NoticeState
          variant="info"
          title="Limited admin actions"
          message="Only super-admins can create or delete tenants. You can view and update status where permitted."
        />
      )}

      {tenantStats.suspended > 0 && (
        <NoticeState
          variant="warning"
          title="Suspended tenants"
          message={`${tenantStats.suspended} tenant(s) are suspended. Their users may lose access until you reactivate.`}
        />
      )}

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="stat bg-base-100 rounded-lg shadow">
          <div className="stat-title">Total Tenants</div>
          <div className="stat-value text-primary">{tenantStats.total}</div>
        </div>
        <div className="stat bg-base-100 rounded-lg shadow">
          <div className="stat-title">Active</div>
          <div className="stat-value text-success">{tenantStats.active}</div>
        </div>
        <div className="stat bg-base-100 rounded-lg shadow">
          <div className="stat-title">Suspended</div>
          <div className="stat-value text-warning">{tenantStats.suspended}</div>
        </div>
        <div className="stat bg-base-100 rounded-lg shadow">
          <div className="stat-title">With Restaurant</div>
          <div className="stat-value text-info">{tenantStats.withRestaurant}</div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-4 items-center justify-between">
        <div className="flex flex-wrap gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-base-content/50" />
            <input
              type="text"
              placeholder="Search tenants..."
              className="input input-bordered pl-10"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          
          <select 
            className="select select-bordered"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="suspended">Suspended</option>
            <option value="pending">Pending</option>
          </select>
        </div>

        {isSuperAdmin && (
          <button 
            className="btn btn-primary"
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          >
            <Plus className="w-4 h-4 mr-2" />
            Review Tenants
          </button>
        )}
      </div>

      {/* Tenants Grid */}
      {filteredTenants.length === 0 ? (
        tenants.length === 0 ? (
          <EmptyState
            size="md"
            icon={<Building2 className="h-10 w-10 text-base-content/50" aria-hidden />}
            title="No tenants yet"
            description="When partner properties join Hotel Etuna, they will be listed here."
            action={
              isSuperAdmin
                ? { label: 'Review tenants', onClick: () => window.scrollTo({ top: 0, behavior: 'smooth' }) }
                : undefined
            }
          />
        ) : (
          <EmptyState
            size="md"
            icon={<Search className="h-10 w-10 text-base-content/50" aria-hidden />}
            title="No tenants match your filters"
            description="Try another search or reset filters to see all tenants."
            action={{
              label: 'Clear filters',
              onClick: () => {
                setSearchQuery('');
                setStatusFilter('all');
              },
            }}
          />
        )
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTenants.map((tenant) => (
            <div key={tenant.id} className="card bg-base-100 shadow-lg hover:shadow-xl transition-shadow">
              <div className="card-body">
                <div className="flex items-start justify-between">
                  <div>
                    <h2 className="card-title">
                      {tenant.name}
                      {tenant.status === 'active' ? (
                        <CheckCircle className="w-5 h-5 text-success" />
                      ) : (
                        <XCircle className="w-5 h-5 text-warning" />
                      )}
                    </h2>
                    <p className="text-sm text-base-content/60">
                      {tenant.subdomain ? `${tenant.subdomain}.buffr.host` : tenant.domain || 'No domain'}
                    </p>
                  </div>
                  <span className={`badge ${tenant.status === 'active' ? 'badge-success' : 'badge-warning'}`}>
                    {tenant.status}
                  </span>
                </div>

                <div className="divider my-2"></div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
                  <div>
                    <span className="text-base-content/60">Properties</span>
                    <p className="font-semibold">{tenant.property_count || 0}</p>
                  </div>
                  <div>
                    <span className="text-base-content/60">Users</span>
                    <p className="font-semibold">{tenant.user_count || 0}</p>
                  </div>
                  <div>
                    <span className="text-base-content/60">Rooms</span>
                    <p className="font-semibold">{tenant.room_count}</p>
                  </div>
                  <div>
                    <span className="text-base-content/60">Type</span>
                    <p className="font-semibold capitalize">{tenant.property_type || 'Standard'}</p>
                  </div>
                </div>

                <div className="card-actions justify-end mt-4">
                  <button 
                    className="btn btn-ghost btn-sm"
                    onClick={() => {
                      setSelectedTenant(tenant);
                      setShowDetailModal(true);
                    }}
                  >
                    <Eye className="w-4 h-4" />
                    View
                  </button>
                  {isSuperAdmin && (
                    <>
                      <button
                        type="button"
                        className="btn btn-ghost btn-sm"
                        disabled={mutatingTenantId === tenant.id}
                        onClick={() => handleStatusToggle(tenant)}
                      >
                        {mutatingTenantId === tenant.id ? (
                          <span className="loading loading-spinner loading-xs" />
                        ) : null}
                        {tenant.status === 'active' ? 'Suspend' : 'Activate'}
                      </button>
                      <button
                        type="button"
                        className="btn btn-ghost btn-sm text-error"
                        disabled={mutatingTenantId === tenant.id}
                        onClick={() => handleDeleteTenant(tenant.id)}
                      >
                        Delete
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Tenant Detail Modal */}
      {showDetailModal && selectedTenant && (
        <div className="modal modal-open">
          <div className="modal-box w-full max-w-lg mx-4 sm:mx-auto sm:max-w-2xl">
            <h3 className="font-bold text-lg mb-4">Tenant Details</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Name</label>
                <p className="text-base-content/70">{selectedTenant.name}</p>
              </div>
              <div>
                <label className="text-sm font-medium">Status</label>
                <p className="text-base-content/70 capitalize">{selectedTenant.status}</p>
              </div>
              <div>
                <label className="text-sm font-medium">Subdomain</label>
                <p className="text-base-content/70">{selectedTenant.subdomain || 'N/A'}</p>
              </div>
              <div>
                <label className="text-sm font-medium">Domain</label>
                <p className="text-base-content/70">{selectedTenant.domain || 'N/A'}</p>
              </div>
              <div>
                <label className="text-sm font-medium">Property Type</label>
                <p className="text-base-content/70 capitalize">{selectedTenant.property_type || 'Standard'}</p>
              </div>
              <div>
                <label className="text-sm font-medium">Room Count</label>
                <p className="text-base-content/70">{selectedTenant.room_count}</p>
              </div>
              <div>
                <label className="text-sm font-medium">Restaurant Features</label>
                <p className="text-base-content/70">
                  {selectedTenant.has_restaurant_features ? 'Enabled' : 'Disabled'}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium">Created</label>
                <p className="text-base-content/70">
                  {new Date(selectedTenant.created_at).toLocaleDateString()}
                </p>
              </div>
            </div>
            <div className="modal-action">
              <button 
                className="btn" 
                onClick={() => {
                  setShowDetailModal(false);
                  setSelectedTenant(null);
                }}
              >
                Close
              </button>
            </div>
          </div>
          <div className="modal-backdrop" onClick={() => setShowDetailModal(false)}></div>
        </div>
      )}
    </div>
  );
}
