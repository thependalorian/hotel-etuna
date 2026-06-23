import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Offline',
  robots: { index: false, follow: false },
};

import Link from 'next/link';
import { Button } from '@/components/ui/Button';

export default function OfflinePage() {
  return (
    <main className="min-h-screen bg-nude-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-white border border-nude-200 rounded-etuna-card p-8 text-center">
        <h1 className="font-display text-3xl text-ci-secondary-chocolate mb-3">You are offline</h1>
        <p className="text-ink-700 mb-6">
          Cached pages are still available. New bookings will be queued and synced when you reconnect.
        </p>
        <Button asChild>
          <Link href="/">Back to home</Link>
        </Button>
      </div>
    </main>
  );
}
