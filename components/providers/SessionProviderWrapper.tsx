'use client';

/**
 * SessionProviderWrapper Component
 * 
 * Purpose: Wraps NextAuth SessionProvider for client-side usage
 * Location: /components/providers/SessionProviderWrapper.tsx
 * 
 * This component is required because SessionProvider uses React Context,
 * which is only available in client components. The root layout is a
 * server component, so we need this wrapper.
 */

import { SessionProvider } from 'next-auth/react';
import { ReactNode } from 'react';

interface SessionProviderWrapperProps {
  children: ReactNode;
}

export function SessionProviderWrapper({ children }: SessionProviderWrapperProps) {
  return <SessionProvider>{children}</SessionProvider>;
}
