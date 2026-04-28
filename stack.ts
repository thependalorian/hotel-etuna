/**
 * Stack Auth Configuration
 * 
 * Purpose: Initialize Stack Auth server app
 * Location: /stack.ts
 * 
 * This file is required by @stackframe/stack for server-side authentication
 * 
 * Stack Auth Project ID: 8935f921-3c67-4e2e-b40f-76c9af7bf79d
 * Trusted Domain: https://host.buffr.ai
 */

import { StackServerApp, StackClientApp } from '@stackframe/stack';

// Get environment variables
const projectId = process.env.NEXT_PUBLIC_STACK_PROJECT_ID;
const publishableClientKey = process.env.NEXT_PUBLIC_STACK_PUBLISHABLE_CLIENT_KEY;
const secretServerKey = process.env.STACK_SECRET_SERVER_KEY;

// Stack Auth is optional - don't throw errors if not configured
// This allows the app to work with NextAuth fallback
let stackServerApp: StackServerApp | null = null;
let stackClientApp: StackClientApp | null = null;

if (projectId) {
  try {
    // Server-side app instance
    stackServerApp = new StackServerApp({
      projectId,
      publishableClientKey: publishableClientKey || undefined,
      secretServerKey: secretServerKey || undefined,
      tokenStore: 'nextjs-cookie',
      urls: {
        signIn: '/handler/sign-in',
        signUp: '/handler/sign-up',
        afterSignIn: '/dashboard',
        afterSignUp: '/dashboard',
        afterSignOut: '/',
      },
    });

    // Client-side app instance (for StackProvider)
    stackClientApp = new StackClientApp({
      projectId,
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
  } catch (error) {
    console.error('⚠️  Failed to initialize Stack Auth:', error);
    // Continue without Stack Auth - NextAuth will be used as fallback
  }
} else {
  console.warn('⚠️  NEXT_PUBLIC_STACK_PROJECT_ID is not set. Stack Auth disabled. Using NextAuth fallback.');
}

if (!publishableClientKey) {
  console.warn('⚠️  NEXT_PUBLIC_STACK_PUBLISHABLE_CLIENT_KEY is not set. Stack Auth may not work properly.');
}

if (!secretServerKey) {
  console.warn('⚠️  STACK_SECRET_SERVER_KEY is not set. Stack Auth may not work properly.');
}

// Export with null checks - middleware will check if Stack Auth is configured
export { stackServerApp, stackClientApp };
