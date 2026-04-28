/**
 * Platform Admin - Support Page
 *
 * Purpose: Support tickets (Drizzle-backed API; platform admin only)
 * Location: app/(dashboard)/admin/platform/support/page.tsx
 */

import React from 'react';
import { getCurrentPlatformAdmin } from '@/lib/auth/platform-admin';
import PlatformSupport from '@/components/features/admin/platform/PlatformSupport';

export default async function PlatformSupportPage() {
  const user = await getCurrentPlatformAdmin();

  if (!user) {
    return null;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="buffr-page-title mb-2">Support</h1>
        <p className="text-base-content/70">Tenant support tickets and responses</p>
      </div>
      <PlatformSupport />
    </div>
  );
}
