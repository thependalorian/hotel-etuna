'use client';

import { useSession } from 'next-auth/react';
import { Mail, Building, Calendar, User as UserIcon } from 'lucide-react';
import { useEffect, useState } from 'react';
import LoadingSpinner from '@/components/shared/LoadingSpinner';
import ErrorDisplay from '@/components/shared/ErrorDisplay';
import { apiUrl } from '@/lib/utils/api-url';
import { securityLogger } from '@/lib/utils/security-logger.client';

interface UserData {
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  tenantName: string;
  memberSince: string;
}

export default function ProfilePage() {
  const { data: session } = useSession();
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchUserData() {
      if (session?.user) {
        try {
          // Fetch user details from API
          const response = await fetch(apiUrl('/api/user/profile'));
          if (response.ok) {
            const data = await response.json();
            setUserData(data);
          } else {
            // Fallback to session data
            securityLogger.warn('[ProfilePage] API returned non-OK status:', response.status);
            const nameParts = (session.user.name || '').split(' ');
            setUserData({
              firstName: nameParts[0] || '',
              lastName: nameParts.slice(1).join(' ') || '',
              email: session.user.email || '',
              role: session.user.role || 'USER',
              tenantName: 'Default', // Tenant name not available in session
              memberSince: new Date().getFullYear().toString(),
            });
          }
        } catch (error) {
          securityLogger.error('[ProfilePage] Error fetching user data:', error);
          // Fallback to session data
          const nameParts = (session.user.name || '').split(' ');
          setUserData({
            firstName: nameParts[0] || '',
            lastName: nameParts.slice(1).join(' ') || '',
            email: session.user.email || '',
            role: session.user.role || 'USER',
            tenantName: 'Default', // Tenant name not available in session
            memberSince: new Date().getFullYear().toString(),
          });
        } finally {
          setLoading(false);
        }
      } else {
        // No session - set loading to false
        setLoading(false);
      }
    }
    fetchUserData();
  }, [session]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" text="Loading profile..." />
      </div>
    );
  }

  if (!userData) {
    return (
      <ErrorDisplay
        error="Unable to load profile data"
        title="Profile Error"
        variant="full"
      />
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="etuna-page-title mb-2">Profile</h1>
        <p className="etuna-page-desc">
          Manage your account settings and preferences
        </p>
      </div>

      {/* Profile Card */}
      <div className="card bg-base-100 shadow-lg card-hover">
        <div className="card-body">
          <div className="flex items-center gap-4 mb-6">
            <div className="avatar placeholder">
              <div className="bg-primary text-primary-content rounded-full w-20 h-20 flex items-center justify-center shadow-md">
                <span className="text-2xl font-bold text-primary-content">
                  {userData.firstName?.[0] || ''}{userData.lastName?.[0] || ''}
                </span>
              </div>
            </div>
            <div>
              <h2 className="text-2xl font-bold font-display">
                {userData.firstName} {userData.lastName}
              </h2>
              <p className="text-base-content/70">{userData.email}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="form-control">
              <label className="label">
                <span className="label-text font-medium">First Name</span>
              </label>
              <input
                type="text"
                className="input input-bordered min-h-[44px] bg-base-200"
                value={userData.firstName}
                readOnly
              />
            </div>

            <div className="form-control">
              <label className="label">
                <span className="label-text font-medium">Last Name</span>
              </label>
              <input
                type="text"
                className="input input-bordered min-h-[44px] bg-base-200"
                value={userData.lastName}
                readOnly
              />
            </div>

            <div className="form-control">
              <label className="label">
                <span className="label-text font-medium">Email Address</span>
              </label>
              <div className="input-group">
                <span className="bg-base-200 border border-base-300 rounded-l-lg px-3 flex items-center min-h-[44px]">
                  <Mail className="w-5 h-5 text-base-content/70" />
                </span>
                <input
                  type="email"
                  className="input input-bordered flex-1 min-h-[44px] bg-base-200 rounded-l-none"
                  value={userData.email}
                  readOnly
                />
              </div>
            </div>

            <div className="form-control">
              <label className="label">
                <span className="label-text font-medium">Role</span>
              </label>
              <div className="input-group">
                <span className="bg-base-200 border border-base-300 rounded-l-lg px-3 flex items-center min-h-[44px]">
                  <UserIcon className="w-5 h-5 text-base-content/70" />
                </span>
                <input
                  type="text"
                  className="input input-bordered flex-1 min-h-[44px] bg-base-200 rounded-l-none capitalize"
                  value={userData.role}
                  readOnly
                />
              </div>
            </div>
          </div>

          <div className="divider"></div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="card bg-base-200 shadow-sm animate-slide-up">
              <div className="card-body">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-base-content/60 mb-1">Tenant</p>
                    <p className="text-2xl font-bold text-primary">{userData.tenantName}</p>
                  </div>
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <Building className="w-6 h-6 text-primary" />
                  </div>
                </div>
              </div>
            </div>

            <div className="card bg-base-200 shadow-sm animate-slide-up" style={{ animationDelay: '100ms' }}>
              <div className="card-body">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-base-content/60 mb-1">Member Since</p>
                    <p className="text-2xl font-bold text-secondary">{userData.memberSince}</p>
                  </div>
                  <div className="w-12 h-12 rounded-xl bg-secondary/10 flex items-center justify-center flex-shrink-0">
                    <Calendar className="w-6 h-6 text-secondary" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}