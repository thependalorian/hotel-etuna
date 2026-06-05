/**
 * Room-type gallery — scroll on small screens, responsive grid on large.
 * Location: components/RoomsFilmstrip.tsx
 */

import Image from 'next/image';
import Link from 'next/link';
import { Users, Camera } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import type { HubRoomTypeCatalogEntry } from '@/lib/data/room-type-catalog';
import { getPublicRoomDisplay } from '@/lib/rooms/room-display';
import { publicCopy } from '@/lib/copy/public';

type RoomsFilmstripProps = {
  rooms: HubRoomTypeCatalogEntry[];
  isAuthenticated: boolean;
};

export default function RoomsFilmstrip({ rooms, isAuthenticated }: RoomsFilmstripProps) {
  if (rooms.length === 0) {
    return (
      <section className="py-12 sm:py-16" aria-label="Room types">
        <div className="container mx-auto px-4">
          <div className="mx-auto max-w-lg rounded-2xl border border-nude-200 bg-white p-6 text-center shadow-card sm:p-8">
            <p className="font-display text-lg font-semibold text-terracotta-900">
              Room listings are updating
            </p>
            <p className="mt-2 text-sm text-terracotta-800">
              Please check back shortly or contact us to enquire about availability.
            </p>
            <Button asChild size="md" className="mt-6 min-h-11">
              <Link href="/contact">{publicCopy.ctas.contactConcierge}</Link>
            </Button>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section id="tour" className="scroll-mt-24 py-12 sm:py-16" aria-label="Room types">
      <div className="container mx-auto px-4">
        <p className="mx-auto mb-6 max-w-2xl text-center text-base text-terracotta-800 sm:mb-8 sm:text-lg">
          Explore each room through a photo tour — walk through the space before you book.
        </p>
        <div className="flex gap-4 overflow-x-auto pb-2 snap-x snap-mandatory scrollbar-thin sm:gap-5 md:grid md:grid-cols-2 md:overflow-visible md:snap-none md:pb-0 lg:grid-cols-3 xl:grid-cols-5">
          {rooms.map((room) => {
            const display = getPublicRoomDisplay({
              ...room,
              roomNumber: room.roomNumbers[0] ?? room.roomNumber,
            });
            const hero =
              display.tourStops[0]?.imageSrc ??
              room.images[0] ??
              '/images/hospitality/hotel_room.jpeg';
            const isPremier = room.slug === 'premiere-room';

            return (
              <article
                key={room.slug}
                className={`w-[min(88vw,320px)] shrink-0 snap-center overflow-hidden rounded-2xl border bg-white shadow-card md:w-full md:shrink ${
                  isPremier ? 'border-khaki-500 ring-2 ring-khaki-500/30' : 'border-nude-200'
                }`}
              >
                <div className="relative aspect-4/3">
                  <Image
                    src={hero}
                    alt={room.roomType}
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 88vw, (max-width: 1280px) 45vw, 20vw"
                  />
                  {isPremier ? (
                    <span className="badge absolute left-3 top-3 border-0 bg-khaki-600 text-white">
                      Flagship stay
                    </span>
                  ) : null}
                </div>
                <div className="p-4 sm:p-5">
                  <h2 className="font-display text-lg font-bold text-terracotta-900 sm:text-xl">
                    {room.roomType}
                  </h2>
                  <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-terracotta-700 sm:gap-3 sm:text-sm">
                    <span className="inline-flex items-center gap-1">
                      <Users className="h-4 w-4 shrink-0 text-khaki-600" aria-hidden />
                      Up to {display.displayOccupancy} guests
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <Camera className="h-4 w-4 shrink-0 text-khaki-600" aria-hidden />
                      {display.tourStops.length} photo stops
                    </span>
                  </div>
                  <p className="mt-3 line-clamp-2 text-sm text-terracotta-800">{display.summary}</p>
                  <div className="mt-3 flex flex-wrap gap-1.5 sm:mt-4">
                    {display.highlights.slice(0, 3).map((h) => (
                      <span
                        key={h}
                        className="badge badge-sm border-0 bg-khaki-600/10 text-khaki-800"
                      >
                        {h}
                      </span>
                    ))}
                  </div>
                  {!isAuthenticated ? (
                    <p className="mt-3 text-xs font-medium text-khaki-700">
                      {publicCopy.gated.roomTourRatesHidden}
                    </p>
                  ) : null}
                  <Button asChild size="md" className="mt-3 w-full min-h-11 sm:mt-4">
                    <Link href={`/rooms/${room.slug}#tour`}>{publicCopy.ctas.takeTheTour}</Link>
                  </Button>
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
