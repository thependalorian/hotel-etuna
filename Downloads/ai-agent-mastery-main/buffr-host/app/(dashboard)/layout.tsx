'use client';

import React, { useState } from 'react';
import Sidebar from '@/components/shared/Sidebar';
import Header from '@/components/shared/Header';
import { DashboardErrorBoundary } from '@/components/DashboardErrorBoundary';

export const dynamic = 'force-dynamic';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <div className="flex h-screen overflow-hidden bg-surface-canvas">
      <Sidebar 
        isMobileOpen={isMobileMenuOpen}
        onMobileClose={() => setIsMobileMenuOpen(false)}
      />
      <div className="flex-1 flex flex-col min-w-0 lg:ml-0">
        <Header />
        <main className="flex-1 overflow-y-auto scrollbar-thin px-4 py-5 sm:px-6 md:px-8 md:py-8">
          <div className="max-w-7xl mx-auto w-full">
            <DashboardErrorBoundary>{children}</DashboardErrorBoundary>
          </div>
        </main>
      </div>
    </div>
  );
}