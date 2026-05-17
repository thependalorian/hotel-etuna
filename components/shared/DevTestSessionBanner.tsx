/**
 * Dev-only banner when a leftover test-account session cookie is still active.
 * Location: /components/shared/DevTestSessionBanner.tsx
 */

'use client';

import { signOut, useSession } from 'next-auth/react';
import { isDisposableTestEmail } from '@/lib/auth/public-session-nav';

export function DevTestSessionBanner() {
  const { data: session, status } = useSession();

  if (process.env.NODE_ENV !== 'development') {
    return null;
  }

  if (status !== 'authenticated') {
    return null;
  }

  const email = session?.user?.email;
  if (!isDisposableTestEmail(email)) {
    return null;
  }

  return (
    <div
      role="status"
      className="bg-warning/15 border-b border-warning/40 px-4 py-2 text-sm text-base-content flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2"
    >
      <p>
        You are still signed in as a test account ({email}). Public pages will show rates as if you
        are a guest. This is a saved browser session, not automatic login.
      </p>
      <button
        type="button"
        className="btn btn-warning btn-sm min-h-[44px] shrink-0"
        onClick={() => void signOut({ callbackUrl: '/' })}
      >
        Sign out test account
      </button>
    </div>
  );
}
