/**
 * Platform Admin Layout with drawer sidebar
 * 
 * Purpose: Layout wrapper for platform admin dashboard routes with PlatformSidebar.
 * Location: app/(dashboard)/admin/platform/layout.tsx
 * 
 * Features:
 * - Platform-specific sidebar navigation
 * - Access control enforcement
 * - Consistent drawer pattern with other layouts
 */

'use client';

import React, { useState, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { PlatformSidebar } from '@/components/shared/PlatformSidebar';
import Header from '@/components/shared/Header';
import { PlatformToastProvider } from '@/components/PlatformToastProvider';

export const dynamic = 'force-dynamic';

export default function PlatformAdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const router = useRouter();

  const closeMobileMenu = useCallback(() => {
    setIsMobileMenuOpen(false);
  }, []);

  const toggleMobileMenu = useCallback(() => {
    setIsMobileMenuOpen((open) => !open);
  }, []);

  // Client-side role check (server-side should also enforce this)
  useEffect(() => {
    async function checkAccess() {
      try {
        const res = await fetch('/api/auth/check-platform-admin', { credentials: 'include' });
        if (!res.ok) {
          router.push('/unauthorized');
        }
      } catch {
        router.push('/unauthorized');
      }
    }
    checkAccess();
  }, [router]);

  return (
    <div className="flex h-screen overflow-hidden bg-surface-canvas">
      <PlatformSidebar 
        isMobileOpen={isMobileMenuOpen}
        onMobileClose={closeMobileMenu}
      />
      <div className="flex-1 flex flex-col min-w-0 lg:ml-0">
        <Header onMobileMenuToggle={toggleMobileMenu} />
        <main className="etuna-dashboard-main scrollbar-thin" role="main" aria-label="Platform console">
          <PlatformToastProvider>
            <div className="etuna-dashboard-inner">{children}</div>
          </PlatformToastProvider>
        </main>
      </div>
    </div>
  );
}
