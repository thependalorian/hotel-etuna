/**
 * Canonical Hotel Etuna property photography (committed under public/images/property).
 * Location: lib/rooms/property-images.ts
 *
 * Use these instead of generic /images/hospitality stock when rooms.images[] is empty.
 */

export const ETUNA_PROPERTY_IMAGES = {
  heroExterior: '/images/property/reception-exterior.png',
  receptionDesk: '/images/property/reception-desk.png',
  roomDoubleRondavel: '/images/property/room-double-rondavel.png',
  roomTwin: '/images/property/room-twin.png',
  roomPremiere: '/images/property/room-premiere.png',
  bathroomModern: '/images/property/bathroom-modern.png',
  bathroomRustic: '/images/property/bathroom-rustic.png',
  hallway: '/images/property/hallway.png',
  outdoorDining: '/images/property/outdoor-dining.png',
  restaurantBar: '/images/property/restaurant-bar.png',
  exteriorRondavels: '/images/property/exterior-rondavels.png',
} as const;

export type EtunaPropertyImageKey = keyof typeof ETUNA_PROPERTY_IMAGES;

/** Default hero for marketing pages when CMS/DB has no image. */
export const ETUNA_HERO_IMAGE = ETUNA_PROPERTY_IMAGES.heroExterior;

/** Per room-type slug when DB images[] is empty. */
export const ETUNA_ROOM_HERO_BY_SLUG: Record<string, string> = {
  'standard-room-type-a': ETUNA_PROPERTY_IMAGES.roomDoubleRondavel,
  'standard-room-type-b': ETUNA_PROPERTY_IMAGES.roomTwin,
  'standard-room-type-c': ETUNA_PROPERTY_IMAGES.roomTwin,
  'executive-room': ETUNA_PROPERTY_IMAGES.roomTwin,
  'premiere-room': ETUNA_PROPERTY_IMAGES.roomPremiere,
};
