/**
 * Stack Auth Handler
 *
 * Purpose: Handle Stack Auth routes when fully configured; otherwise guide to NextAuth login.
 * Location: /app/handler/[...stack]/page.tsx
 */

import Link from 'next/link';
import { StackHandler } from '@stackframe/stack';
import { stackServerApp } from '@/stack';
import { isStackAuthServerConfigured } from '@/lib/auth/stack-env';

export default function HandlerPage(props: {
  params: { stack: string[] };
  searchParams: Record<string, string | string[] | undefined>;
}) {
  if (!stackServerApp || !isStackAuthServerConfigured()) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-surface-background px-4">
        <div className="max-w-md rounded-2xl border border-nude-200 bg-white p-8 text-center shadow-card">
          <h1 className="font-display text-xl font-bold text-terracotta-900">
            Sign-in unavailable
          </h1>
          <p className="mt-3 text-sm text-terracotta-800">
            Stack Auth is not configured on this environment. Use email sign-in instead.
          </p>
          <Link href="/login" className="btn btn-primary mt-6 min-h-11">
            Go to sign in
          </Link>
        </div>
      </main>
    );
  }

  return <StackHandler app={stackServerApp} routeProps={props} fullPage />;
}
