/**
 * FacilityShowcase — public "about the space" section + photo gallery for a facility.
 * Location: components/features/facilities/FacilityShowcase.tsx
 *
 * Content priority (CMS/DB first, registry fallback):
 *  - Gallery images: facility room.images[] (managed in room/property management) → placeholder gallery.
 *  - Amenities: facility room.amenities[] → registry amenities.
 *  - Blurb/capacity: registry (rooms table has no description column).
 *  - Rate: passed from the page (facility constants / room.baseRate).
 */

import Image from 'next/image';
import { CheckCircle2, ImageOff } from 'lucide-react';
import {
  FACILITY_SHOWCASE,
  type FacilityKind,
  type FacilityGalleryImage,
} from '@/lib/data/facilities';

type FacilityShowcaseProps = {
  kind: FacilityKind;
  /** DB/CMS-managed facility images (room.images[]). Empty → registry placeholders. */
  images?: string[];
  /** DB/CMS-managed amenities (room.amenities[]). Empty → registry amenities. */
  amenities?: string[];
  /** Display rate line (from facility constants or room.baseRate). */
  rateLabel: string;
};

export function FacilityShowcase({ kind, images, amenities, rateLabel }: FacilityShowcaseProps) {
  const content = FACILITY_SHOWCASE[kind];

  const dbImages = (images ?? []).filter(Boolean);
  const usingPlaceholderImages = dbImages.length === 0;
  const gallery: FacilityGalleryImage[] = usingPlaceholderImages
    ? content.gallery
    : dbImages.map((src, index) => ({ src, alt: `${content.heroAlt} — photo ${index + 1}` }));

  const dbAmenities = (amenities ?? []).filter(Boolean);
  const amenityList = dbAmenities.length > 0 ? dbAmenities : content.amenities;

  return (
    <section className="container mx-auto max-w-5xl px-4 py-12" aria-label={`About the ${content.heroAlt}`}>
      <div className="grid gap-10 md:grid-cols-2 md:items-start">
        {/* Space details */}
        <div className="space-y-5">
          <h2 className="font-display text-2xl font-bold text-ink-900 md:text-3xl">About the space</h2>
          <p className="text-base leading-relaxed text-ink-700">{content.blurb}</p>

          <div className="inline-flex items-center gap-2 rounded-etuna-pill bg-ci-cream px-4 py-2 text-sm font-semibold text-ci-primary">
            {rateLabel}
          </div>

          <p className="text-sm text-ink-600">{content.capacity}</p>

          <ul className="space-y-2.5 pt-1">
            {amenityList.map((amenity) => (
              <li key={amenity} className="flex items-start gap-2.5 text-ink-800">
                <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-ci-accent-sage" aria-hidden />
                <span className="text-sm leading-relaxed">{amenity}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Gallery */}
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            {gallery.map((image, index) => (
              <div
                key={`${image.src}-${index}`}
                className={`etuna-card-media border border-nude-200 ${index === 0 ? 'col-span-2 aspect-video' : 'aspect-square'}`}
              >
                <Image
                  src={image.src}
                  alt={image.alt}
                  fill
                  sizes="(max-width: 768px) 50vw, 33vw"
                  className="object-cover"
                />
              </div>
            ))}
          </div>
          {usingPlaceholderImages ? (
            <p className="flex items-center gap-1.5 text-xs text-ink-500">
              <ImageOff className="h-3.5 w-3.5" aria-hidden />
              Showing placeholder photos — upload {content.heroAlt} images in room management to replace.
            </p>
          ) : null}
        </div>
      </div>
    </section>
  );
}
