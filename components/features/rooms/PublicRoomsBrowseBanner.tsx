/**
 * View-only notice on /rooms — browse tours; sign in to book.
 * Location: components/features/rooms/PublicRoomsBrowseBanner.tsx
 */

import Link from 'next/link';
import { Info } from 'lucide-react';
import { publicCopy } from '@/lib/copy/public';

type PublicRoomsBrowseBannerProps = {
  isAuthenticated: boolean;
  /** Post-login return path (defaults to /rooms). */
  redirectPath?: string;
};

export default function PublicRoomsBrowseBanner({
  isAuthenticated,
  redirectPath = '/rooms',
}: PublicRoomsBrowseBannerProps) {
  if (isAuthenticated) return null;

  return (
    <div className="container mx-auto px-4 pt-8">
      <div
        role="status"
        className="alert border-ci-secondary-tan/80 bg-ci-cream/90 text-ci-secondary-chocolate shadow-sm"
      >
        <Info className="h-5 w-5 shrink-0 text-ci-accent-ochre" aria-hidden />
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
          <span className="text-sm">{publicCopy.gated.roomsBrowseOnly}</span>
          <Link
            href={`/login?redirect=${encodeURIComponent(redirectPath)}`}
            className="btn btn-sm btn-primary min-h-10 shrink-0 border-0"
          >
            {publicCopy.gated.viewPricesAndBook}
          </Link>
        </div>
      </div>
    </div>
  );
}
