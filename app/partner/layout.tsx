/**
 * Partner self-service layout with drawer sidebar.
 *
 * Purpose: Restrict partner UI to self-service navigation only (7 items).
 * Location: /app/partner/layout.tsx
 */

'use client';

import { ReactNode, useState, useCallback } from 'react';
import { SessionTimeoutWrapper } from '@/components/providers/SessionTimeoutWrapper';
import { ActivePropertyProvider } from '@/components/providers/ActivePropertyProvider';
import { PartnerSidebar } from '@/components/partners/PartnerSidebar';
import Header from '@/components/shared/Header';

export default function PartnerLayout({ children }: { children: ReactNode }) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const closeMobileMenu = useCallback(() => {
    setIsMobileMenuOpen(false);
  }, []);

  const toggleMobileMenu = useCallback(() => {
    setIsMobileMenuOpen((open) => !open);
  }, []);

  return (
    <SessionTimeoutWrapper>
      <ActivePropertyProvider>
      <div className="flex h-screen overflow-hidden bg-surface-canvas">
        <PartnerSidebar 
          isMobileOpen={isMobileMenuOpen}
          onMobileClose={closeMobileMenu}
        />
        <div className="flex-1 flex flex-col min-w-0 lg:ml-0">
          <Header onMobileMenuToggle={toggleMobileMenu} />
          <main className="etuna-dashboard-main scrollbar-thin" role="main" aria-label="Partner portal">
            <div className="etuna-dashboard-inner">{children}</div>
          </main>
        </div>
      </div>
      </ActivePropertyProvider>
    </SessionTimeoutWrapper>
  );
}
