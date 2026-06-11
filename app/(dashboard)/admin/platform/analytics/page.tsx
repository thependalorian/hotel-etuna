/**
 * Platform Admin - Analytics Page
 *
 * Purpose: Platform-wide analytics and metrics
 * Location: app/(dashboard)/admin/platform/analytics/page.tsx
 */

import React from 'react';
import { getCurrentPlatformAdmin } from '@/lib/auth/platform-admin';
import { BarChart3 } from 'lucide-react';

export default async function PlatformAnalyticsPage() {
  const user = await getCurrentPlatformAdmin();

  if (!user) {
    return null;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="etuna-page-title mb-2">Platform Analytics</h1>
        <p className="text-base-content/70">
          Platform-wide metrics and usage analytics
        </p>
      </div>
      <div className="card bg-base-100 shadow-lg">
        <div className="card-body items-center justify-center min-h-[320px]">
          <BarChart3 className="w-16 h-16 text-base-content/30" />
          <p className="text-base-content/70">Analytics dashboard coming soon.</p>
        </div>
      </div>
    </div>
  );
}
