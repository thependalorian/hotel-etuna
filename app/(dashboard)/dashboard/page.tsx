/**
 * Dashboard Home Page
 *
 * Purpose: Main dashboard with stats, quick actions, recent activity, and Sofia chat.
 * Location: /app/(dashboard)/dashboard/page.tsx
 * 
 * Design System v1.0.0:
 * - Uses Card components with elevated variant
 * - Grid layout: 1 col mobile → 2 cols tablet → 3 cols desktop
 * - Nude color palette for all text and backgrounds
 * - LoadingSpinner for loading states
 */

'use client';

import { useSession } from 'next-auth/react';
import { SofiaChat } from '@/components/features/sofia/SofiaChat';
import { useEffect, useState } from 'react';
import DashboardWelcome from '@/components/features/dashboard/DashboardWelcome';
import DashboardFocusStrip from '@/components/features/dashboard/DashboardFocusStrip';
import DashboardStatsCards from '@/components/features/dashboard/DashboardStatsCards';
import QuickActions from '@/components/features/dashboard/QuickActions';
import RecentActivity from '@/components/features/dashboard/RecentActivity';
import OnboardingWelcome from '@/components/features/dashboard/OnboardingWelcome';
import LoadingSpinner from '@/components/shared/LoadingSpinner';
import { apiUrl } from '@/lib/utils/api-url';
import { securityLogger } from '@/lib/utils/security-logger.client';

export default function DashboardHomePage() {
  const { data: session } = useSession();
  const [loading, setLoading] = useState(true);
  const [hasProperties, setHasProperties] = useState(false);
  const [stats, setStats] = useState<{
    properties: { total: number; change: number };
    bookings: { total: number; change: number };
    orders: { total: number; change: number };
    guests: { total: number; change: number };
  } | null>(null);
  const [recentActivity, setRecentActivity] = useState<Array<{
    id: string;
    type: string;
    description: string;
    time: string;
    status: string;
  }>>([]);

  useEffect(() => {
    async function fetchData() {
      if (session?.user?.tenantId) {
        try {
          const propertiesResponse = await fetch(apiUrl('/api/properties'));
          if (propertiesResponse.ok) {
            const response = await propertiesResponse.json();
            const propertiesData = response.data || response;
            const properties = Array.isArray(propertiesData) ? propertiesData : [];
            setHasProperties(properties.length > 0);
          }

          const statsResponse = await fetch(apiUrl('/api/dashboard/stats'));
          if (statsResponse.ok) {
            const response = await statsResponse.json();
            const statsData = response.data || response;
            setStats(statsData);
          }

          const activityResponse = await fetch(apiUrl('/api/dashboard/activity?limit=3'));
          if (activityResponse.ok) {
            const activityData = await activityResponse.json();
            setRecentActivity(Array.isArray(activityData) ? activityData : []);
          }
        } catch (error) {
          securityLogger.error('Error fetching dashboard data:', error);
        } finally {
          setLoading(false);
        }
      }
    }
    fetchData();
  }, [session?.user?.tenantId]);

  const userName = session?.user?.name?.split(' ')[0] || session?.user?.email?.split('@')[0] || 'there';

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <LoadingSpinner size="lg" text="Loading dashboard..." />
      </div>
    );
  }

  if (!hasProperties) {
    return <OnboardingWelcome />;
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
      <div className="space-y-6 animate-fade-in">
        <DashboardWelcome userName={userName} />

        <DashboardFocusStrip />

        {stats && <DashboardStatsCards stats={stats} />}

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          <QuickActions />
          <RecentActivity activities={recentActivity} />
          <div className="md:col-span-2 lg:col-span-1 min-w-0">
            <SofiaChat />
          </div>
        </div>
      </div>
    </div>
  );
}
