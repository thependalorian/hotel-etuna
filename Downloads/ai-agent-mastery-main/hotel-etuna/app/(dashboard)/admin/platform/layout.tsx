/**
 * Platform Admin Layout
 * 
 * Purpose: Layout wrapper for platform admin dashboard routes
 * Location: app/(dashboard)/admin/platform/layout.tsx
 * 
 * Features:
 * - Platform admin navigation
 * - Access control enforcement
 * - Consistent layout structure
 */

import React from 'react';
import { redirect } from 'next/navigation';
import { getCurrentPlatformAdmin, isPlatformAdmin } from '@/lib/auth/platform-admin';
import PlatformAdminNavbar from '@/components/features/admin/platform/PlatformAdminNavbar';
import { PlatformToastProvider } from '@/components/PlatformToastProvider';

export const dynamic = 'force-dynamic';

export default async function PlatformAdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentPlatformAdmin();
  
  // Redirect if not platform admin
  if (!user || !isPlatformAdmin(user)) {
    redirect('/unauthorized');
  }

  return (
    <div className="min-h-screen bg-base-200">
      <PlatformAdminNavbar
        user={{
          email: user.email,
          role: user.role ?? 'admin',
          first_name: user.firstName,
          last_name: user.lastName,
        }}
      />
      <PlatformToastProvider>
        <main className="container mx-auto px-4 py-6">{children}</main>
      </PlatformToastProvider>
    </div>
  );
}
