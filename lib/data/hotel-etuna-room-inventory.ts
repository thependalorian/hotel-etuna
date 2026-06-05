/**
 * Hotel Etuna physical room inventory — source of truth for seed + migrations.
 * Location: lib/data/hotel-etuna-room-inventory.ts
 */

import {
  HOTEL_ETUNA_FACILITY_RATES,
  HOTEL_ETUNA_FACILITY_TYPES,
  HOTEL_ETUNA_ROOM_RATES_NAD,
  HOTEL_ETUNA_ROOM_TYPES,
} from '@/lib/constants/hotel-etuna-room-types';
import {
  isFacilityInventoryKind,
  isGuestInventoryKind,
} from '@/lib/rooms/inventory-display';

export type GuestRoomTier = 'standardA' | 'standardB' | 'standardC' | 'executive' | 'premiere';

export type GuestRoomInventoryRow = {
  roomNumber: string;
  tier: GuestRoomTier;
  roomType: string;
  baseRate: string;
  maxOccupancy: number;
  bedConfiguration: string;
  amenities: string[];
};

const BASE_AMENITIES = ['WiFi', 'Aircon', 'TV', 'Minibar', 'Coffee/Tea', 'Mosquito Net', 'Desk'];

function row(
  roomNumber: string,
  tier: GuestRoomTier,
  bedConfiguration: string,
  maxOccupancy: number,
  extraAmenities: string[] = [],
): GuestRoomInventoryRow {
  const roomType = HOTEL_ETUNA_ROOM_TYPES[tier];
  return {
    roomNumber,
    tier,
    roomType,
    baseRate: HOTEL_ETUNA_ROOM_RATES_NAD[tier].toFixed(2),
    maxOccupancy,
    bedConfiguration,
    amenities: [...BASE_AMENITIES, bedConfiguration, ...extraAmenities],
  };
}

const STANDARD_A_NUMBERS = ['5', '6', '8', '17', '19', '21'];
const STANDARD_B_NUMBERS = ['7', '9', '10', '11', '12', '13', '14', '15', '16', '18', '20'];
const STANDARD_C_NUMBERS = ['2', '3', '4'];
const EXECUTIVE_NUMBERS = ['22', 'E1', 'E2', 'E3', 'E4', 'E5', 'E6', 'E8', 'E9', 'E10', 'E11', 'E12', 'E13'];
const PREMIERE_NUMBERS = ['E7', 'E14'];

export const HOTEL_ETUNA_GUEST_ROOM_INVENTORY: GuestRoomInventoryRow[] = [
  ...STANDARD_A_NUMBERS.map((n) => row(n, 'standardA', 'Double bed', 2)),
  ...STANDARD_B_NUMBERS.map((n) => row(n, 'standardB', 'Two single beds', 2)),
  ...STANDARD_C_NUMBERS.map((n) => row(n, 'standardC', 'Double bed and single bed', 3)),
  ...EXECUTIVE_NUMBERS.map((n) =>
    row(n, 'executive', 'Executive layout', 2, ['Work Desk', 'VIP Toiletries', 'Lounge Access']),
  ),
  ...PREMIERE_NUMBERS.map((n) =>
    row(n, 'premiere', 'Premiere layout', 4, [
      'Mini fridge',
      'Private Balcony',
      'Lounge',
      '2 Bathrooms',
      'Bathrobe',
    ]),
  ),
];

export type FacilityKind = 'conference' | 'campsite';

/** One row per facility kind — not a numbered guest room. */
export type FacilityOffering = {
  kind: FacilityKind;
  roomType: string;
  baseRate: string;
  maxOccupancy: number;
  pricingMetadata: Record<string, unknown>;
};

export const HOTEL_ETUNA_FACILITY_COUNT = 2;

export const HOTEL_ETUNA_FACILITY_OFFERINGS: FacilityOffering[] = [
  {
    kind: 'conference',
    roomType: HOTEL_ETUNA_FACILITY_TYPES.conference,
    baseRate: HOTEL_ETUNA_FACILITY_RATES.conferenceSession.toFixed(2),
    maxOccupancy: 200,
    pricingMetadata: {
      sessionStart: '08:00',
      sessionEnd: '17:00',
      pricePerSession: HOTEL_ETUNA_FACILITY_RATES.conferenceSession,
      currency: 'NAD',
    },
  },
  {
    kind: 'campsite',
    roomType: HOTEL_ETUNA_FACILITY_TYPES.campsite,
    baseRate: HOTEL_ETUNA_FACILITY_RATES.campsiteSiteMinimum.toFixed(2),
    maxOccupancy: 50,
    pricingMetadata: {
      namibianPp: HOTEL_ETUNA_FACILITY_RATES.campsiteNamibianPp,
      nonNamibianPp: HOTEL_ETUNA_FACILITY_RATES.campsiteNonNamibianPp,
      siteMinimum: HOTEL_ETUNA_FACILITY_RATES.campsiteSiteMinimum,
      prorateFromMinimum: true,
      currency: 'NAD',
    },
  },
];

export const LEGACY_DEMO_ROOM_PREFIX = 'ET-';

export {
  facilityDbRoomNumber,
  isFacilityInventoryKind,
  isGuestInventoryKind,
  isLegacyFacilityDbRoomNumber,
} from '@/lib/rooms/inventory-display';

/** True when a DB row is one of the 35 guest rooms (numbered units). */
export function isGuestRoomInventoryRow(
  inventoryKind: string | null | undefined,
): boolean {
  return isGuestInventoryKind(inventoryKind);
}

/** True when a DB row is the single conference hall or single campsite. */
export function isFacilityInventoryRow(inventoryKind: string | null | undefined): boolean {
  return isFacilityInventoryKind(inventoryKind);
}
