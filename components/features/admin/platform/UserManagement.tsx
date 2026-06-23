/**
 * User Management Component
 * 
 * Purpose: Component for managing platform users with CRUD operations
 * Location: components/features/admin/platform/UserManagement.tsx
 * 
 * Features:
 * - List all users across tenants
 * - Search and filter users
 * - Suspend/Activate users
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
import Link from 'next/link';
import EmptyState from '@/components/shared/EmptyState';
import NoticeState from '@/components/shared/NoticeState';
import { securityLogger } from '@/lib/utils/security-logger.client';
import {
  Users,
  Search,
  Eye,
  UserCheck,
  UserX,
  Building2,
} from 'lucide-react';

interface UserWithTenant {
  id: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
  role: string;
  status: string;
  tenant_id: string | null;
  is_email_verified: boolean;
  created_at: string;
  last_login_at: string | null;
  tenant_name: string | null;
}

interface UserManagementProps {
  users: UserWithTenant[];
  userRole: string;
}

export default function UserManagement({ users: initialUsers, userRole }: UserManagementProps) {
  const router = useRouter();
  const { showToast } = usePlatformToast();
  const [users] = useState<UserWithTenant[]>(initialUsers);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedUser, setSelectedUser] = useState<UserWithTenant | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [mutatingUserId, setMutatingUserId] = useState<string | null>(null);

  const isSuperAdmin = userRole === 'super-admin';

  const handleStatusToggle = async (user: UserWithTenant) => {
    const newStatus = user.status === 'active' ? 'suspended' : 'active';
    setMutatingUserId(user.id);
    try {
      const response = await fetch(apiUrl(`/api/admin/platform/users/${user.id}`), {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ status: newStatus }),
      });

      if (response.ok) {
        showToast({
          variant: 'success',
          title: 'User updated',
          message: `Status set to ${newStatus}.`,
        });
        router.refresh();
      } else {
        const msg =
          response.status === 429
            ? await rateLimitMessage(response)
            : await messageFromFailedResponse(response);
        showToast({ variant: 'error', title: 'Could not update user', message: msg });
      }
    } catch (error) {
      securityLogger.error('Error updating user status:', error);
      showToast({
        variant: 'error',
        title: 'Could not update user',
        message: networkErrorMessage(error),
      });
    } finally {
      setMutatingUserId(null);
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!confirm('Are you sure you want to delete this user?')) return;

    setMutatingUserId(userId);
    try {
      const response = await fetch(apiUrl(`/api/admin/platform/users/${userId}`), {
        method: 'DELETE',
        credentials: 'include',
      });

      if (response.ok) {
        showToast({ variant: 'success', title: 'User deleted', message: 'The user has been removed.' });
        router.refresh();
      } else {
        const msg =
          response.status === 429
            ? await rateLimitMessage(response)
            : await messageFromFailedResponse(response);
        showToast({ variant: 'error', title: 'Could not delete user', message: msg });
      }
    } catch (error) {
      securityLogger.error('Error deleting user:', error);
      showToast({
        variant: 'error',
        title: 'Could not delete user',
        message: networkErrorMessage(error),
      });
    } finally {
      setMutatingUserId(null);
    }
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = searchQuery === '' || 
      user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (user.first_name && user.first_name.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (user.last_name && user.last_name.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesRole = roleFilter === 'all' || user.role === roleFilter;
    const matchesStatus = statusFilter === 'all' || user.status === statusFilter;
    return matchesSearch && matchesRole && matchesStatus;
  });

  const userCounts = {
    total: users.length,
    active: users.filter(u => u.status === 'active').length,
    suspended: users.filter(u => u.status === 'suspended').length,
    verified: users.filter(u => u.is_email_verified).length,
  };

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="stat bg-base-100 rounded-etuna-input shadow">
          <div className="stat-title">Total Users</div>
          <div className="stat-value text-primary">{userCounts.total}</div>
        </div>
        <div className="stat bg-base-100 rounded-etuna-input shadow">
          <div className="stat-title">Active</div>
          <div className="stat-value text-success">{userCounts.active}</div>
        </div>
        <div className="stat bg-base-100 rounded-etuna-input shadow">
          <div className="stat-title">Suspended</div>
          <div className="stat-value text-warning">{userCounts.suspended}</div>
        </div>
        <div className="stat bg-base-100 rounded-etuna-input shadow">
          <div className="stat-title">Verified Email</div>
          <div className="stat-value text-info">{userCounts.verified}</div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-4 items-center justify-between">
        <div className="flex flex-wrap gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-base-content/50" />
            <input
              type="text"
              placeholder="Search users..."
              className="input input-bordered pl-10"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          
          <select 
            className="select select-bordered"
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
          >
            <option value="all">All Roles</option>
            <option value="owner">Owner</option>
            <option value="admin">Admin</option>
            <option value="manager">Manager</option>
            <option value="staff">Staff</option>
          </select>

          <select 
            className="select select-bordered"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="suspended">Suspended</option>
          </select>
        </div>
      </div>

      {/* Users Table */}
      {filteredUsers.length === 0 ? (
        users.length === 0 ? (
          <EmptyState
            size="md"
            icon={<Users className="h-10 w-10 text-base-content/50" aria-hidden />}
            title="No users yet"
            description="When people sign up or are invited, they will appear here."
          />
        ) : (
          <EmptyState
            size="md"
            icon={<Search className="h-10 w-10 text-base-content/50" aria-hidden />}
            title="No users match your filters"
            description="Try a different search term or reset filters to see everyone again."
            action={{
              label: 'Clear filters',
              onClick: () => {
                setSearchQuery('');
                setRoleFilter('all');
                setStatusFilter('all');
              },
            }}
          />
        )
      ) : (
        <div className="overflow-x-auto bg-base-100 rounded-etuna-input shadow">
          <table className="table">
            <thead>
              <tr>
                <th>User</th>
                <th>Tenant</th>
                <th>Role</th>
                <th>Status</th>
                <th>Verified</th>
                <th>Last Login</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map((user) => (
                <tr key={user.id}>
                  <td>
                    <div className="flex items-center gap-3">
                      <div className="avatar placeholder">
                        <div className="bg-neutral text-neutral-content rounded-full w-10">
                          <span className="text-xs">
                            {user.first_name?.[0] || user.email[0].toUpperCase()}
                          </span>
                        </div>
                      </div>
                      <div>
                        <div className="font-medium">
                          {user.first_name} {user.last_name}
                        </div>
                        <div className="text-sm text-base-content/60">
                          {user.email}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td>
                    <div className="flex items-center gap-2">
                      <Building2 className="w-4 h-4 text-base-content/50" />
                      {user.tenant_name || 'N/A'}
                    </div>
                  </td>
                  <td>
                    <span className={`badge badge-sm ${
                      user.role === 'owner' ? 'badge-primary' :
                      user.role === 'admin' ? 'badge-secondary' :
                      user.role === 'manager' ? 'badge-accent' :
                      'badge-ghost'
                    }`}>
                      {user.role}
                    </span>
                  </td>
                  <td>
                    <span className={`badge badge-sm ${
                      user.status === 'active' ? 'badge-success' : 'badge-warning'
                    }`}>
                      {user.status}
                    </span>
                  </td>
                  <td>
                    {user.is_email_verified ? (
                      <UserCheck className="w-4 h-4 text-success" />
                    ) : (
                      <UserX className="w-4 h-4 text-warning" />
                    )}
                  </td>
                  <td className="text-sm text-base-content/60">
                    {user.last_login_at 
                      ? new Date(user.last_login_at).toLocaleDateString()
                      : 'Never'}
                  </td>
                  <td>
                    <div className="dropdown dropdown-end">
                      <label tabIndex={0} className="btn btn-ghost btn-sm">
                        Actions
                      </label>
                      <ul tabIndex={0} className="dropdown-content z-[1] menu p-2 shadow bg-base-100 rounded-box w-52">
                        <li>
                          <Link
                            href={`/admin/platform/users/${user.id}`}
                            className="flex items-center gap-2"
                          >
                            <Eye className="w-4 h-4" />
                            Open page
                          </Link>
                        </li>
                        <li>
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedUser(user);
                              setShowDetailModal(true);
                            }}
                          >
                            <Eye className="w-4 h-4" />
                            Quick view
                          </button>
                        </li>
                        {isSuperAdmin && (
                          <>
                            <li>
                              <button
                                type="button"
                                disabled={mutatingUserId === user.id}
                                onClick={() => handleStatusToggle(user)}
                              >
                                {mutatingUserId === user.id ? (
                                  <span className="loading loading-spinner loading-xs" />
                                ) : null}
                                {user.status === 'active' ? 'Suspend' : 'Activate'}
                              </button>
                            </li>
                            <li>
                              <button
                                type="button"
                                disabled={mutatingUserId === user.id}
                                onClick={() => handleDeleteUser(user.id)}
                                className="text-error"
                              >
                                Delete
                              </button>
                            </li>
                          </>
                        )}
                      </ul>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* User Detail Modal */}
      {showDetailModal && selectedUser && (
        <div className="modal modal-open">
          <div className="modal-box w-full max-w-lg mx-4 sm:mx-auto sm:max-w-2xl">
            <h3 className="font-bold text-lg mb-4">User Details</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Email</label>
                <p className="text-base-content/70">{selectedUser.email}</p>
              </div>
              <div>
                <label className="text-sm font-medium">Full Name</label>
                <p className="text-base-content/70">
                  {selectedUser.first_name} {selectedUser.last_name}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium">Role</label>
                <p className="text-base-content/70">{selectedUser.role}</p>
              </div>
              <div>
                <label className="text-sm font-medium">Status</label>
                <p className="text-base-content/70">{selectedUser.status}</p>
              </div>
              <div>
                <label className="text-sm font-medium">Tenant</label>
                <p className="text-base-content/70">{selectedUser.tenant_name || 'N/A'}</p>
              </div>
              <div>
                <label className="text-sm font-medium">Email Verified</label>
                <p className="text-base-content/70">
                  {selectedUser.is_email_verified ? 'Yes' : 'No'}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium">Created</label>
                <p className="text-base-content/70">
                  {new Date(selectedUser.created_at).toLocaleString()}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium">Last Login</label>
                <p className="text-base-content/70">
                  {selectedUser.last_login_at 
                    ? new Date(selectedUser.last_login_at).toLocaleString()
                    : 'Never'}
                </p>
              </div>
            </div>
            <div className="modal-action">
              <button 
                className="btn" 
                onClick={() => {
                  setShowDetailModal(false);
                  setSelectedUser(null);
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
