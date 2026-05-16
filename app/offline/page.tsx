import Link from 'next/link';

export default function OfflinePage() {
  return (
    <main className="min-h-screen bg-nude-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-white border border-nude-200 rounded-2xl p-8 text-center">
        <h1 className="font-display text-3xl text-terracotta-900 mb-3">You are offline</h1>
        <p className="text-terracotta-800 mb-6">
          Cached pages are still available. New bookings will be queued and synced when you reconnect.
        </p>
        <Link
          href="/"
          className="btn btn-primary min-h-[44px] inline-flex items-center justify-center px-6"
        >
          Back to home
        </Link>
      </div>
    </main>
  );
}
