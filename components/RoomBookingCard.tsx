/**
 * Sticky price and booking card for room detail pages.
 * Location: components/RoomBookingCard.tsx
 */

import Link from 'next/link';
import { Calendar, Refrigerator } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { publicCopy } from '@/lib/copy/public';
import type { HubRoom } from '@/lib/data/rooms';
import type { PublicRoomDisplay } from '@/lib/rooms/room-display';

type RoomBookingCardProps = {
  room: HubRoom;
  display: PublicRoomDisplay;
  slug: string;
  isAuthenticated: boolean;
};

export default function RoomBookingCard({
  room,
  display,
  slug,
  isAuthenticated,
}: RoomBookingCardProps) {
  const price = room.priceFrom;
  const currency = room.currency ?? 'NAD';

  return (
    <div className="rounded-2xl bg-white p-5 shadow-card sm:p-6 lg:sticky lg:top-24">
      <div className="mb-4 flex items-center gap-2 text-sm text-terracotta-800">
        <Refrigerator className="h-4 w-4 text-khaki-600" aria-hidden />
        Mini fridge in every room
      </div>

      <div className="mb-6">
        <div className="mb-1 font-display text-2xl font-bold text-khaki-600 sm:text-3xl lg:text-4xl">
          {isAuthenticated
            ? price !== null && !Number.isNaN(Number(price))
              ? `${currency} ${Number(price).toLocaleString()}`
              : 'Price on request'
            : publicCopy.gated.viewRates}
        </div>
        <p className="text-terracotta-800">per night · up to {display.displayOccupancy} guests</p>
      </div>

      {isAuthenticated ? (
        <Button asChild size="lg" className="mb-3 w-full min-h-11">
          <Link href="#booking">
            <Calendar className="h-5 w-5" aria-hidden />
            {publicCopy.ctas.completeYourBooking}
          </Link>
        </Button>
      ) : (
        <div className="rounded-lg border border-khaki-600/30 bg-khaki-50 p-4">
          <p className="mb-3 text-sm text-terracotta-900">{publicCopy.gated.roomAvailableSignIn}</p>
          <div className="flex gap-2">
            <Button asChild size="sm" className="min-h-11 flex-1">
              <Link href={`/login?redirect=/rooms/${slug}`}>{publicCopy.ctas.signIn}</Link>
            </Button>
            <Button asChild size="sm" variant="outline" className="min-h-11 flex-1">
              <Link href={`/register?redirect=/rooms/${slug}`}>{publicCopy.ctas.signUp}</Link>
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
