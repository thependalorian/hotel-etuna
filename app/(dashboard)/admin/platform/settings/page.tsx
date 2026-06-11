/**
 * Platform Admin - Settings Page
 *
 * Purpose: Platform-wide settings (super-admin only)
 * Location: app/(dashboard)/admin/platform/settings/page.tsx
 */

import React from 'react';
import { getCurrentPlatformAdmin, isSuperAdmin } from '@/lib/auth/platform-admin';
import { redirect } from 'next/navigation';
import SystemSettings from '@/components/features/admin/platform/SystemSettings';

export default async function PlatformSettingsPage() {
  const user = await getCurrentPlatformAdmin();

  if (!user) {
    return null;
  }

  if (!isSuperAdmin(user)) {
    redirect('/admin/platform');
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="etuna-page-title mb-2">Platform Settings</h1>
        <p className="text-base-content/70">
          Global platform configuration
        </p>
      </div>
      <SystemSettings userRole={user.role ?? 'admin'} />
    </div>
  );
}
