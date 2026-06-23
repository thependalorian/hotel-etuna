/**
 * Stack Auth Handler
 *
 * Purpose: Handle Stack Auth routes when fully configured; otherwise guide to NextAuth login.
 * Location: /app/handler/[...stack]/page.tsx
 */

import Link from 'next/link';
import { Button } from '@/components/ui/Button';
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
        <div className="max-w-md rounded-etuna-card border border-nude-200 bg-white p-8 text-center">
          <h1 className="font-display text-xl font-bold text-ci-secondary-chocolate">
            Sign-in unavailable
          </h1>
          <p className="mt-3 text-sm text-ink-600">
            Stack Auth is not configured on this environment. Use email sign-in instead.
          </p>
          <Button asChild className="mt-6">
            <Link href="/login">Go to sign in</Link>
          </Button>
        </div>
      </main>
    );
  }

  return <StackHandler app={stackServerApp} routeProps={props} fullPage />;
}
