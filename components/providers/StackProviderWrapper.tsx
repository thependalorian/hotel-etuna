/**
 * StackProviderWrapper Component
 *
 * Purpose: Wraps StackProvider for client-side usage in Next.js App Router.
 * Skips initialization when Stack keys are missing or still placeholders.
 * Location: /components/providers/StackProviderWrapper.tsx
 */

'use client';

import { StackProvider, StackTheme, StackClientApp } from '@stackframe/stack';
import { ReactNode, useMemo } from 'react';
import { isStackAuthClientConfigured, readStackAuthEnv } from '@/lib/auth/stack-env';
import { securityLogger } from '@/lib/utils/security-logger.client';

interface StackProviderWrapperProps {
  children: ReactNode;
}

export function StackProviderWrapper({ children }: StackProviderWrapperProps) {
  const stackClientApp = useMemo(() => {
    const env = readStackAuthEnv();

    if (!isStackAuthClientConfigured(env)) {
      if (process.env.NODE_ENV === 'development' && env.projectId) {
        securityLogger.info(
          '[Stack Auth] Disabled — set NEXT_PUBLIC_STACK_PUBLISHABLE_CLIENT_KEY (and STACK_SECRET_SERVER_KEY on the server) from your Stack dashboard. Using NextAuth.',
        );
      }
      return null;
    }

    try {
      return new StackClientApp({
        projectId: env.projectId,
        publishableClientKey: env.publishableClientKey,
        tokenStore: 'nextjs-cookie',
        urls: {
          signIn: '/handler/sign-in',
          signUp: '/handler/sign-up',
          afterSignIn: '/dashboard',
          afterSignUp: '/dashboard',
          afterSignOut: '/',
        },
      });
    } catch (error: unknown) {
      if (process.env.NODE_ENV === 'development') {
        const message = error instanceof Error ? error.message : String(error);
        securityLogger.warn('[Stack Auth] Failed to initialize client', { error: message });
      }
      return null;
    }
  }, []);

  if (!stackClientApp) {
    return <>{children}</>;
  }

  return (
    <StackProvider app={stackClientApp}>
      <StackTheme>{children}</StackTheme>
    </StackProvider>
  );
}
