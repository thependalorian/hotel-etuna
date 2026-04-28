/**
 * SystemSettings Component
 *
 * Purpose: Super-admin system settings panel for platform controls.
 * Location: components/features/admin/platform/SystemSettings.tsx
 */
'use client';

import PlatformSettings from '@/components/features/admin/platform/PlatformSettings';

interface SystemSettingsProps {
  userRole: string;
}

export default function SystemSettings({ userRole }: SystemSettingsProps) {
  return <PlatformSettings userRole={userRole} />;
}
