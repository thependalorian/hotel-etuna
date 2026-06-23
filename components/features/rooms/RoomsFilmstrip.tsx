/**
 * Room-type gallery — scroll on small screens, responsive grid on large.
 * Location: components/features/rooms/RoomsFilmstrip.tsx
 */

import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import {
  EtunaCarouselRow,
  EtunaListingCard,
  EtunaSectionHeader,
} from '@/components/features/marketing';
import type { HubRoomTypeCatalogEntry } from '@/lib/data/room-type-catalog';
import { getPublicRoomDisplay } from '@/lib/rooms/room-display';
import { publicCopy } from '@/lib/copy/public';
import { ETUNA_PROPERTY_IMAGES, ETUNA_ROOM_HERO_BY_SLUG } from '@/lib/rooms/property-images';
import { formatPublicRoomRateLabel } from '@/lib/rooms/public-rate';

type RoomsFilmstripProps = {
  rooms: HubRoomTypeCatalogEntry[];
  isAuthenticated: boolean;
};

export default function RoomsFilmstrip({ rooms, isAuthenticated }: RoomsFilmstripProps) {
  if (rooms.length === 0) {
    return (
      <section className="py-12 sm:py-16" aria-label="Room types">
        <div className="etuna-container-marketing">
          <div className="mx-auto max-w-lg rounded-etuna-card border border-nude-200 bg-white p-6 text-center sm:p-8">
            <p className="font-display text-heading-sm font-semibold text-ci-secondary-chocolate">
              Room listings are updating
            </p>
            <p className="mt-2 text-body text-ink-600">
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
    <section id="tour" className="scroll-mt-24 py-12 sm:section-gap" aria-label="Room types">
      <div className="etuna-container-marketing">
        <EtunaSectionHeader title="Explore our rooms" href="/rooms" />
        <p className="mb-6 max-w-2xl text-body text-ink-600 sm:mb-8">
          Walk through each space in a photo tour before you book.
        </p>
        <EtunaCarouselRow
          className="md:grid md:grid-cols-2 md:overflow-visible lg:grid-cols-3 xl:grid-cols-5"
          ariaLabel="Room types"
        >
          {rooms.map((room) => {
            const display = getPublicRoomDisplay({
              ...room,
              roomNumber: room.roomNumbers[0] ?? room.roomNumber,
            });
            const hero =
              display.tourStops[0]?.imageSrc ??
              room.images[0] ??
              ETUNA_ROOM_HERO_BY_SLUG[room.slug] ??
              ETUNA_PROPERTY_IMAGES.roomDoubleRondavel;
            const isPremier = room.slug === 'premiere-room';
            const meta = `Up to ${display.displayOccupancy} guests · ${display.tourStops.length} photo stops`;

            return (
              <EtunaListingCard
                key={room.slug}
                href={`/rooms/${room.slug}#tour`}
                imageSrc={hero}
                imageAlt={room.roomType}
                title={room.roomType}
                meta={meta}
                price={
                  !isAuthenticated ? formatPublicRoomRateLabel(room, false) : undefined
                }
                featuredLabel={isPremier ? 'Flagship stay' : null}
                imageSizes="(max-width: 768px) 88vw, (max-width: 1280px) 45vw, 20vw"
              >
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {display.highlights.slice(0, 2).map((h) => (
                    <span
                      key={h}
                      className="rounded-etuna-badge bg-ci-primary/10 px-2 py-0.5 text-caption font-medium text-ci-secondary-chocolate"
                    >
                      {h}
                    </span>
                  ))}
                </div>
                <p className="mt-2 text-body font-semibold text-ci-accent-ochre">
                  {publicCopy.ctas.takeTheTour} →
                </p>
              </EtunaListingCard>
            );
          })}
        </EtunaCarouselRow>
      </div>
    </section>
  );
}
