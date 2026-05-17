/**
 * Stack Auth Configuration
 *
 * Purpose: Initialize Stack Auth server app when env keys are valid.
 * Location: /stack.ts
 *
 * Stack Auth is optional — the app uses NextAuth when Stack is not configured.
 */

import { StackServerApp, StackClientApp } from '@stackframe/stack';
import {
  isStackAuthClientConfigured,
  isStackAuthServerConfigured,
  readStackAuthEnv,
} from '@/lib/auth/stack-env';

let stackServerApp: StackServerApp | null = null;
let stackClientApp: StackClientApp | null = null;

const env = readStackAuthEnv();
const stackUrls = {
  signIn: '/handler/sign-in',
  signUp: '/handler/sign-up',
  afterSignIn: '/dashboard',
  afterSignUp: '/dashboard',
  afterSignOut: '/',
} as const;

if (isStackAuthServerConfigured(env)) {
  try {
    stackServerApp = new StackServerApp({
      projectId: env.projectId,
      publishableClientKey: env.publishableClientKey,
      secretServerKey: env.secretServerKey,
      tokenStore: 'nextjs-cookie',
      urls: stackUrls,
    });
  } catch (error) {
    console.error('[Stack Auth] Failed to initialize server app:', error);
    stackServerApp = null;
  }
}

if (isStackAuthClientConfigured(env)) {
  try {
    stackClientApp = new StackClientApp({
      projectId: env.projectId,
      publishableClientKey: env.publishableClientKey,
      tokenStore: 'nextjs-cookie',
      urls: stackUrls,
    });
  } catch (error) {
    console.error('[Stack Auth] Failed to initialize client app:', error);
    stackClientApp = null;
  }
}

export { stackServerApp, stackClientApp };
