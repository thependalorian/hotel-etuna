/**
 * StackProviderWrapper Component
 * 
 * Purpose: Wraps StackProvider for client-side usage in Next.js App Router
 * Location: /components/providers/StackProviderWrapper.tsx
 * 
 * This component is required because StackProvider uses React Context,
 * which is only available in client components. The root layout is a
 * server component, so we need this wrapper.
 */

'use client';

import { StackProvider, StackTheme, StackClientApp } from '@stackframe/stack';
import { ReactNode, useMemo } from 'react';

interface StackProviderWrapperProps {
  children: ReactNode;
}

export function StackProviderWrapper({ children }: StackProviderWrapperProps) {
  // Create StackClientApp instance from environment variables
  // These are available in the browser via NEXT_PUBLIC_ prefix
  const stackClientApp = useMemo(() => {
    const projectId = process.env.NEXT_PUBLIC_STACK_PROJECT_ID?.trim();
    const publishableClientKey = process.env.NEXT_PUBLIC_STACK_PUBLISHABLE_CLIENT_KEY?.trim();

    if (!projectId) {
      // Stack Auth not configured - return null to skip provider
      return null;
    }

    // Validate UUID format (trim whitespace first)
    const trimmedProjectId = projectId.trim();
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(trimmedProjectId)) {
      // Only log error in development to avoid console spam
      if (process.env.NODE_ENV === 'development') {
        console.warn('NEXT_PUBLIC_STACK_PROJECT_ID is not a valid UUID format. Stack Auth will be disabled.', {
          received: projectId,
          length: projectId.length,
          trimmed: trimmedProjectId,
        });
      }
      return null;
    }

    if (!publishableClientKey) {
      console.warn('NEXT_PUBLIC_STACK_PUBLISHABLE_CLIENT_KEY is not set');
    }

    try {
      return new StackClientApp({
        projectId: trimmedProjectId,
        publishableClientKey: publishableClientKey || undefined,
        tokenStore: 'nextjs-cookie',
        urls: {
          signIn: '/handler/sign-in',
          signUp: '/handler/sign-up',
          afterSignIn: '/dashboard',
          afterSignUp: '/dashboard',
          afterSignOut: '/',
        },
      });
    } catch (error: any) {
      // Only log error in development
      if (process.env.NODE_ENV === 'development') {
        console.error('Failed to initialize StackClientApp:', error.message);
      }
      return null;
    }
  }, []);

  if (!stackClientApp) {
    // Fallback if Stack Auth is not configured
    return <>{children}</>;
  }

  return (
    <StackProvider app={stackClientApp}>
      <StackTheme>
        {children}
      </StackTheme>
    </StackProvider>
  );
}
