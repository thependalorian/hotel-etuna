/**
 * Partner — Profile
 *
 * Purpose: Partner account overview within the partner portal shell (not staff /profile).
 * Location: /app/partner/profile/page.tsx
 */

'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { Mail, User as UserIcon, Settings } from 'lucide-react';
import LoadingSpinner from '@/components/shared/LoadingSpinner';
import ErrorDisplay from '@/components/shared/ErrorDisplay';
import { Card } from '@/components/ui/Card';
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

export default function PartnerProfilePage() {
  const { data: session, status } = useSession();
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchUserData() {
      if (status === 'loading') return;

      if (!session?.user) {
        setLoading(false);
        return;
      }

      try {
        const response = await fetch(apiUrl('/api/user/profile'));
        if (response.ok) {
          const data = await response.json();
          setUserData(data);
        } else {
          securityLogger.warn('[PartnerProfilePage] API returned non-OK status:', response.status);
          const nameParts = (session.user.name || '').split(' ');
          setUserData({
            firstName: nameParts[0] || '',
            lastName: nameParts.slice(1).join(' ') || '',
            email: session.user.email || '',
            role: session.user.role || 'PARTNER',
            tenantName: 'Partner property',
            memberSince: new Date().getFullYear().toString(),
          });
        }
      } catch (error) {
        securityLogger.error('[PartnerProfilePage] Error fetching user data:', error);
        const nameParts = (session.user.name || '').split(' ');
        setUserData({
          firstName: nameParts[0] || '',
          lastName: nameParts.slice(1).join(' ') || '',
          email: session.user.email || '',
          role: session.user.role || 'PARTNER',
          tenantName: 'Partner property',
          memberSince: new Date().getFullYear().toString(),
        });
      } finally {
        setLoading(false);
      }
    }

    void fetchUserData();
  }, [session, status]);

  if (loading || status === 'loading') {
    return (
      <div className="flex justify-center py-12">
        <LoadingSpinner size="lg" text="Loading profile…" />
      </div>
    );
  }

  if (!userData) {
    return (
      <ErrorDisplay
        variant="full"
        title="Profile unavailable"
        error="Sign in again to view your partner profile."
      />
    );
  }

  const displayName = [userData.firstName, userData.lastName].filter(Boolean).join(' ') || 'Partner';

  return (
    <div className="max-w-2xl space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-base-content">Profile</h1>
          <p className="text-sm text-base-content/70">Your partner account details</p>
        </div>
        <Link href="/partner/settings" className="btn btn-outline btn-sm rounded-full px-6 gap-2">
          <Settings className="h-4 w-4" aria-hidden />
          Edit in settings
        </Link>
      </div>

      <Card className="p-6 space-y-4">
        <div className="flex items-center gap-4">
          <div className="avatar placeholder">
            <div className="bg-primary/10 text-primary rounded-full w-16">
              <UserIcon className="h-8 w-8" aria-hidden />
            </div>
          </div>
          <div>
            <p className="text-xl font-semibold text-base-content">{displayName}</p>
            <p className="text-sm text-base-content/70 capitalize">{userData.role.toLowerCase()}</p>
          </div>
        </div>

        <div className="divider my-0" />

        <dl className="space-y-3 text-sm">
          <div className="flex items-start gap-3">
            <Mail className="h-4 w-4 mt-0.5 text-base-content/60 shrink-0" aria-hidden />
            <div>
              <dt className="font-medium text-base-content">Email</dt>
              <dd className="text-base-content/80">{userData.email}</dd>
            </div>
          </div>
          <div>
            <dt className="font-medium text-base-content">Property</dt>
            <dd className="text-base-content/80">{userData.tenantName}</dd>
          </div>
          <div>
            <dt className="font-medium text-base-content">Member since</dt>
            <dd className="text-base-content/80">{userData.memberSince}</dd>
          </div>
        </dl>
      </Card>
    </div>
  );
}
