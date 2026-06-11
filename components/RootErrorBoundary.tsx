/**
 * Top-level client error boundary for marketing, auth, and other non-dashboard routes
 *
 * Purpose: Catches errors under the root layout outside the dashboard shell’s inner boundary.
 * Location: components/RootErrorBoundary.tsx
 */

'use client';

import React from 'react';
import { ErrorBoundary } from '@/components/shared/ErrorBoundary';

export function RootErrorBoundary({ children }: { children: React.ReactNode }) {
  return (
    <ErrorBoundary homeHref="/" homeLabel="Home">
      {children}
    </ErrorBoundary>
  );
}
