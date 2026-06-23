/**
 * Facility showcase content (conference hall + campsite) for the public facility pages.
 * Location: lib/data/facilities.ts
 *
 * ⚠️ IMAGES ARE PLACEHOLDERS (isPlaceholder: true). They currently reuse committed Hotel Etuna
 * property/hospitality photography so the pages render with NO broken images. To use real
 * conference/campsite photos later, change each `src` here only (drop files in
 * public/images/facilities/ or paste an allow-listed Unsplash/Wikimedia URL — see
 * next.config remotePatterns) and drop the `isPlaceholder` flag. This registry is the single
 * source of truth for facility imagery and copy.
 */

import { ETUNA_PROPERTY_IMAGES } from '@/lib/rooms/property-images';

export type FacilityKind = 'conference' | 'campsite';

export type FacilityGalleryImage = {
  src: string;
  alt: string;
  /** True while this points at a stand-in property photo, not real facility photography. */
  isPlaceholder?: boolean;
};

export type FacilityShowcaseContent = {
  kind: FacilityKind;
  /** Human label for the facility (used in alt text + notices). */
  heroAlt: string;
  /** Hero background passed to PublicHero. */
  heroImage: string;
  heroIsPlaceholder: boolean;
  /** One-paragraph description of the space. */
  blurb: string;
  /** Short capacity / usage line. */
  capacity: string;
  /** Bullet amenities — kept conservative/truthful; edit here as facts firm up. */
  amenities: string[];
  gallery: FacilityGalleryImage[];
};

export const FACILITY_SHOWCASE: Record<FacilityKind, FacilityShowcaseContent> = {
  conference: {
    kind: 'conference',
    heroAlt: 'conference hall',
    heroImage: '/images/hospitality/hero_hotel_lobby.jpeg', // PLACEHOLDER
    heroIsPlaceholder: true,
    blurb:
      'Host meetings, training days, and small events in our conference hall — a calm, ' +
      'well-lit space in central Ongwediva, about 500 metres from the Ongwediva Trade Fair ' +
      'Centre. Book by the session and let our team handle the setup so you can focus on the room.',
    capacity: 'Flexible seating for meetings, workshops, and small functions.',
    amenities: [
      'Full-day session (08:00–17:00)',
      'Central Ongwediva — ~500 m from the Trade Fair Centre',
      'On-site parking',
      'Catering & refreshments from our restaurant on request',
      'Projector & screen on request',
    ],
    gallery: [
      { src: ETUNA_PROPERTY_IMAGES.receptionDesk, alt: 'Hotel Etuna reception (placeholder for conference hall)', isPlaceholder: true },
      { src: ETUNA_PROPERTY_IMAGES.restaurantBar, alt: 'Event & refreshment space (placeholder)', isPlaceholder: true },
      { src: ETUNA_PROPERTY_IMAGES.hallway, alt: 'Interior space (placeholder for conference hall)', isPlaceholder: true },
    ],
  },
  campsite: {
    kind: 'campsite',
    heroAlt: 'campsite',
    heroImage: ETUNA_PROPERTY_IMAGES.exteriorRondavels, // PLACEHOLDER
    heroIsPlaceholder: true,
    blurb:
      'Reserve the Hotel Etuna campsite on a whole-site basis — ideal for groups, gatherings, ' +
      'and overlanders who want the grounds to themselves. Per-person rates apply on top of the ' +
      'site minimum, with full access to the hotel’s restaurant and bar.',
    capacity: 'Whole-site exclusive hire — priced per person above a site minimum.',
    amenities: [
      'Exclusive whole-site hire',
      'Namibian & non-Namibian per-person rates',
      'Access to the hotel restaurant & bar',
      'Central Ongwediva location',
      'On-site parking',
    ],
    gallery: [
      { src: ETUNA_PROPERTY_IMAGES.outdoorDining, alt: 'Outdoor dining area (placeholder for campsite)', isPlaceholder: true },
      { src: '/images/hospitality/resort_exterior.jpeg', alt: 'Grounds & exterior (placeholder for campsite)', isPlaceholder: true },
      { src: ETUNA_PROPERTY_IMAGES.heroExterior, alt: 'Hotel Etuna grounds (placeholder)', isPlaceholder: true },
    ],
  },
};
