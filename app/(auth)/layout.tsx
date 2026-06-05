/**
 * Auth route group layout
 *
 * Purpose: Shared layout + SEO metadata for all auth pages.
 * Location: /app/(auth)/layout.tsx
 */

import type { Metadata } from 'next';
import type { ReactNode } from 'react';

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default function AuthLayout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
