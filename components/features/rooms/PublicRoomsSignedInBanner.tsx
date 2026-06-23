/**
 * Shown on /rooms when signed in — same photo tours, rates and booking enabled.
 * Location: components/features/rooms/PublicRoomsSignedInBanner.tsx
 */

import { CheckCircle } from 'lucide-react';
import { publicCopy } from '@/lib/copy/public';

type PublicRoomsSignedInBannerProps = {
  isAuthenticated: boolean;
};

export default function PublicRoomsSignedInBanner({
  isAuthenticated,
}: PublicRoomsSignedInBannerProps) {
  if (!isAuthenticated) return null;

  return (
    <div className="container mx-auto px-4 pt-6 sm:pt-8">
      <div
        role="status"
        className="alert border-ci-accent-sage/40 bg-ci-accent-sage/10 text-ci-secondary-chocolate shadow-sm"
      >
        <CheckCircle className="h-5 w-5 shrink-0 text-sage" aria-hidden />
        <span className="text-sm">{publicCopy.gated.roomsSignedInHint}</span>
      </div>
    </div>
  );
}
