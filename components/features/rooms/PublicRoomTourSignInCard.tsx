/**
 * Guest-only CTA on room tour pages — no rate typography or "per night" copy.
 * Location: components/features/rooms/PublicRoomTourSignInCard.tsx
 */

import Link from 'next/link';
import { Lock } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { publicCopy } from '@/lib/copy/public';
import type { PublicRoomDisplay } from '@/lib/rooms/room-display';

type PublicRoomTourSignInCardProps = {
  slug: string;
  display: PublicRoomDisplay;
};

export default function PublicRoomTourSignInCard({
  slug,
  display,
}: PublicRoomTourSignInCardProps) {
  return (
    <aside
      className="rounded-etuna-card border border-ci-primary/25 bg-ci-cream/80 p-5 sm:p-6"
      aria-label="Sign in to view rates and book"
    >
      <div className="mb-3 flex items-start gap-2">
        <Lock className="mt-0.5 h-4 w-4 shrink-0 text-ci-accent-ochre" aria-hidden />
        <div>
          <p className="text-sm font-semibold text-ci-secondary-chocolate">
            {publicCopy.gated.roomTourRatesHidden}
          </p>
          <p className="mt-1 text-sm text-ink-700">
            Photo tour is free to browse. Sign in to see nightly rates and complete your booking.
          </p>
        </div>
      </div>
      <p className="mb-4 text-xs text-ink-600">
        Up to {display.displayOccupancy} guests · mini fridge in every room
      </p>
      <div className="flex flex-col gap-2 sm:flex-row">
        <Button asChild size="md" className="min-h-11 flex-1">
          <Link href={`/login?redirect=/rooms/${slug}`}>{publicCopy.ctas.signIn}</Link>
        </Button>
        <Button asChild size="md" variant="outline" className="min-h-11 flex-1">
          <Link href={`/register?redirect=/rooms/${slug}`}>{publicCopy.ctas.signUp}</Link>
        </Button>
      </div>
    </aside>
  );
}
