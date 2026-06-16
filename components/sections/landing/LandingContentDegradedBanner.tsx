/**
 * LandingContentDegradedBanner — user-safe notice when homepage DB content fails.
 * Location: components/sections/landing/LandingContentDegradedBanner.tsx
 */

'use client';

export function LandingContentDegradedBanner() {
  return (
    <div className="alert alert-warning rounded-none border-x-0 border-t-0" role="alert">
      <div className="flex w-full flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm">
          We could not load the latest rooms and partner listings. Showing standard room
          information — dining, reviews, and partners may be unavailable.
        </p>
        <button
          type="button"
          className="btn btn-outline btn-sm rounded-full px-6 shrink-0"
          onClick={() => window.location.reload()}
        >
          Retry
        </button>
      </div>
    </div>
  );
}
