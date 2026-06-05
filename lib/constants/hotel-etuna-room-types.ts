/**
 * Canonical Hotel Etuna hub room types (3 categories, 5 bookable layouts).
 * Location: lib/constants/hotel-etuna-room-types.ts
 */

export const HOTEL_ETUNA_ROOM_TYPES = {
  standardA: 'Standard Room (Type A)',
  standardB: 'Standard Room (Type B)',
  standardC: 'Standard Room (Type C)',
  executive: 'Executive Room',
  premiere: 'Premiere Room',
} as const;

export type HotelEtunaRoomTypeLabel =
  (typeof HOTEL_ETUNA_ROOM_TYPES)[keyof typeof HOTEL_ETUNA_ROOM_TYPES];

export const HOTEL_ETUNA_ROOM_RATES_NAD = {
  standardA: 800,
  standardB: 800,
  standardC: 1200,
  executive: 1000,
  premiere: 2000,
} as const;

export const HOTEL_ETUNA_FACILITY_TYPES = {
  conference: 'Conference Hall / Facilities',
  campsite: 'Campsite',
} as const;

export const HOTEL_ETUNA_FACILITY_RATES = {
  conferenceSession: 1200,
  campsiteNamibianPp: 250,
  campsiteNonNamibianPp: 400,
  campsiteSiteMinimum: 1200,
} as const;

/** URL slugs derived from room_type labels via slugify(). */
export const HOTEL_ETUNA_ROOM_SLUGS = [
  'standard-room-type-a',
  'standard-room-type-b',
  'standard-room-type-c',
  'executive-room',
  'premiere-room',
] as const;

export const HOTEL_ETUNA_ROOM_CATEGORY_SUMMARY =
  'Premiere Room, Executive Room, and Standard Room (Types A, B, and C)';

export const HOTEL_ETUNA_GUEST_ROOM_COUNT = 35;
