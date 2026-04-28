/**
 * Path-aware error boundary for the main (dashboard) route group
 *
 * Purpose: Uses /admin/platform recovery link on platform admin URLs; otherwise /properties.
 * Location: components/DashboardErrorBoundary.tsx
 */

'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import { ErrorBoundary } from '@/components/ErrorBoundary';

export function DashboardErrorBoundary({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() ?? '';
  const isPlatformAdmin = pathname.startsWith('/admin/platform');

  return (
    <ErrorBoundary
      homeHref={isPlatformAdmin ? '/admin/platform' : '/properties'}
      homeLabel={isPlatformAdmin ? 'Platform home' : 'Dashboard'}
    >
      {children}
    </ErrorBoundary>
  );
}
