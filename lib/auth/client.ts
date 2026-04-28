/**
 * Stack Auth Client (Client-Side)
 * 
 * Purpose: Client-side authentication helpers for React components
 * Location: /lib/auth/client.ts
 * 
 * Features:
 * - Sign in/out with Stack Auth
 * - Get current session
 * - OAuth sign in
 * - User management hooks
 * 
 * Note: Uses @stackframe/stack client SDK
 */

'use client';

// Re-export Stack Auth hooks and components for convenience
export { StackProvider, useUser, useStackApp, StackTheme } from '@stackframe/stack';
