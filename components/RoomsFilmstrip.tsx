/**
 * Horizontal room-type gallery with tour stop counts — entry to photo tours.
 * Location: components/RoomsFilmstrip.tsx
 */

import Image from 'next/image';
import Link from 'next/link';
import { Users, Camera } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import type { HubRoom } from '@/lib/data/rooms';
import { getPublicRoomDisplay } from '@/lib/rooms/room-display';
import { publicCopy } from '@/lib/copy/public';

type RoomsFilmstripProps = {
  rooms: HubRoom[];
  isAuthenticated: boolean;
};

export default function RoomsFilmstrip({ rooms, isAuthenticated }: RoomsFilmstripProps) {
  return (
    <section className="py-16" aria-label="Room types">
      <div className="container mx-auto px-4">
        <p className="mx-auto mb-8 max-w-2xl text-center text-lg text-terracotta-800">
          Explore each room through a photo tour — walk through the space before you book.
        </p>
        <div className="-mx-4 flex gap-5 overflow-x-auto px-4 pb-4 snap-x snap-mandatory scrollbar-thin">
          {rooms.map((room) => {
            const display = getPublicRoomDisplay(room);
            const hero =
              display.tourStops[0]?.imageSrc ??
              room.images[0] ??
              '/images/hospitality/hotel_room.jpeg';
            const isPremier = room.slug === 'premier-room';

            return (
              <article
                key={room.id}
                className={`w-[min(85vw,320px)] shrink-0 snap-center overflow-hidden rounded-2xl border bg-white shadow-card ${
                  isPremier ? 'border-khaki-500 ring-2 ring-khaki-500/30' : 'border-nude-200'
                }`}
              >
                <div className="relative aspect-4/3">
                  <Image src={hero} alt={room.roomType} fill className="object-cover" sizes="320px" />
                  {isPremier ? (
                    <span className="badge absolute left-3 top-3 border-0 bg-khaki-600 text-white">
                      Flagship stay
                    </span>
                  ) : null}
                </div>
                <div className="p-5">
                  <h2 className="font-display text-xl font-bold text-terracotta-900">{room.roomType}</h2>
                  <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-terracotta-700">
                    <span className="inline-flex items-center gap-1">
                      <Users className="h-4 w-4 text-khaki-600" aria-hidden />
                      Up to {display.displayOccupancy} guests
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <Camera className="h-4 w-4 text-khaki-600" aria-hidden />
                      {display.tourStops.length} photo stops
                    </span>
                  </div>
                  <p className="mt-3 line-clamp-2 text-sm text-terracotta-800">{display.summary}</p>
                  <div className="mt-4 flex flex-wrap gap-1.5">
                    {display.highlights.slice(0, 3).map((h) => (
                      <span
                        key={h}
                        className="badge badge-sm border-0 bg-khaki-600/10 text-khaki-800"
                      >
                        {h}
                      </span>
                    ))}
                  </div>
                  <Button asChild size="md" className="mt-5 w-full min-h-11">
                    <Link href={`/rooms/${room.slug}#tour`}>
                      {isAuthenticated ? 'Take the tour' : publicCopy.ctas.viewDetails}
                    </Link>
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
