'use client';

/**
 * Sticky price and booking card — signed-in guests only on public room tour pages.
 * Location: components/RoomBookingCard.tsx
 */

import Link from 'next/link';
import { Calendar, Refrigerator } from 'lucide-react';
import { useSession } from 'next-auth/react';
import { Button } from '@/components/ui/Button';
import { publicCopy } from '@/lib/copy/public';
import type { PublicRoomDisplay } from '@/lib/rooms/room-display';

type RoomBookingCardProps = {
  display: PublicRoomDisplay;
  slug: string;
  /** Server hint; client session is authoritative for showing numeric rates. */
  rateLabel: string;
};

export default function RoomBookingCard({ display, slug, rateLabel }: RoomBookingCardProps) {
  const { status } = useSession();
  const showRates = status === 'authenticated';

  if (!showRates) {
    return null;
  }

  return (
    <div className="rounded-2xl bg-white p-5 shadow-card sm:p-6 lg:sticky lg:top-24">
      <div className="mb-4 flex items-center gap-2 text-sm text-terracotta-800">
        <Refrigerator className="h-4 w-4 text-khaki-600" aria-hidden />
        Mini fridge in every room
      </div>

      <div className="mb-6">
        <div className="mb-1 font-display text-2xl font-bold text-khaki-600 sm:text-3xl lg:text-4xl">
          {rateLabel}
        </div>
        <p className="text-terracotta-800">per night · up to {display.displayOccupancy} guests</p>
      </div>

      <Button asChild size="lg" className="mb-3 w-full min-h-11">
        <Link href="#booking">
          <Calendar className="h-5 w-5" aria-hidden />
          {publicCopy.ctas.completeYourBooking}
        </Link>
      </Button>
    </div>
  );
}
