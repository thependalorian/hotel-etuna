/**
 * View-only notice on /rooms — browse tours; sign in to book.
 * Location: components/PublicRoomsBrowseBanner.tsx
 */

import Link from 'next/link';
import { Info } from 'lucide-react';
import { publicCopy } from '@/lib/copy/public';

type PublicRoomsBrowseBannerProps = {
  isAuthenticated: boolean;
};

export default function PublicRoomsBrowseBanner({ isAuthenticated }: PublicRoomsBrowseBannerProps) {
  if (isAuthenticated) return null;

  return (
    <div className="container mx-auto px-4 pt-8">
      <div
        role="status"
        className="alert border-khaki-200/80 bg-khaki-50/90 text-terracotta-900 shadow-sm"
      >
        <Info className="h-5 w-5 shrink-0 text-khaki-700" aria-hidden />
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
          <span className="text-sm">{publicCopy.gated.roomsBrowseOnly}</span>
          <Link
            href="/login?redirect=/rooms"
            className="btn btn-sm btn-primary min-h-10 shrink-0 border-0 bg-khaki-600 text-white hover:bg-khaki-700"
          >
            {publicCopy.gated.viewPricesAndBook}
          </Link>
        </div>
      </div>
    </div>
  );
}
