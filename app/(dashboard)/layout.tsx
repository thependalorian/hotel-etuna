'use client';

import React, { useState, useCallback } from 'react';
import Sidebar from '@/components/shared/Sidebar';
import Header from '@/components/shared/Header';
import { DashboardErrorBoundary } from '@/components/DashboardErrorBoundary';
import { SessionTimeoutWrapper } from '@/components/providers/SessionTimeoutWrapper';

export const dynamic = 'force-dynamic';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const closeMobileMenu = useCallback(() => {
    setIsMobileMenuOpen(false);
  }, []);

  const toggleMobileMenu = useCallback(() => {
    setIsMobileMenuOpen((open) => !open);
  }, []);

  return (
    <SessionTimeoutWrapper>
      <div className="flex h-screen overflow-hidden bg-surface-canvas">
        <Sidebar 
          isMobileOpen={isMobileMenuOpen}
          onMobileClose={closeMobileMenu}
        />
        <div className="flex-1 flex flex-col min-w-0 lg:ml-0">
          <Header onMobileMenuToggle={toggleMobileMenu} />
          <main className="buffr-dashboard-main scrollbar-thin" role="main" aria-label="Main content">
            <div className="buffr-dashboard-inner">
              <DashboardErrorBoundary>{children}</DashboardErrorBoundary>
            </div>
          </main>
        </div>
      </div>
    </SessionTimeoutWrapper>
  );
}