/**
 * Pre-arrival magic link landing — verifies token and redirects to stay hub.
 * Location: /app/guest/welcome/page.tsx
 */

'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
function WelcomeContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [verifying, setVerifying] = useState(true);

  useEffect(() => {
    const token = searchParams.get('token');
    if (!token) {
      setError('This welcome link is missing a token. Check your email or contact front desk.');
      setVerifying(false);
      return;
    }

    void (async () => {
      try {
        const res = await fetch('/api/guest/magic-link/verify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token }),
        });
        const json = await res.json();
        if (!res.ok) {
          throw new Error(json?.error?.message ?? 'Link could not be verified.');
        }
        router.replace(json.data?.redirectUrl ?? `/guest/stays/${json.data?.bookingId}`);
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Something went wrong.');
        setVerifying(false);
      }
    })();
  }, [searchParams, router]);

  if (verifying && !error) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <span className="loading loading-spinner loading-lg text-primary" aria-hidden="true" />
        <p className="text-nude-700">Opening your guest hub…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-md mx-auto py-16 text-center space-y-4">
        <h1 className="font-display text-2xl font-bold text-nude-900">Welcome link problem</h1>
        <p className="text-nude-600">{error}</p>
        <Link href="/login" className="btn btn-primary rounded-full px-6">
          Sign in instead
        </Link>
      </div>
    );
  }

  return null;
}

export default function GuestWelcomePage() {
  return (
    <Suspense
      fallback={
        <div className="py-20 text-center">
          <span className="loading loading-spinner" />
        </div>
      }
    >
      <WelcomeContent />
    </Suspense>
  );
}
