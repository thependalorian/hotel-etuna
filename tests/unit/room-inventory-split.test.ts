import { describe, expect, it } from 'vitest';
import {
  HOTEL_ETUNA_FACILITY_COUNT,
  HOTEL_ETUNA_FACILITY_OFFERINGS,
  isFacilityInventoryRow,
  isGuestRoomInventoryRow,
} from '@/lib/data/hotel-etuna-room-inventory';
import { HOTEL_ETUNA_ROOM_TYPES } from '@/lib/constants/hotel-etuna-room-types';
import {
  facilityDbRoomNumber,
  getInventoryListingTitle,
  isLegacyFacilityDbRoomNumber,
} from '@/lib/rooms/inventory-display';

describe('guest vs facility inventory', () => {
  it('has exactly one conference hall and one campsite offering', () => {
    expect(HOTEL_ETUNA_FACILITY_COUNT).toBe(2);
    expect(HOTEL_ETUNA_FACILITY_OFFERINGS.map((f) => f.kind).sort()).toEqual([
      'campsite',
      'conference',
    ]);
    expect(
      HOTEL_ETUNA_FACILITY_OFFERINGS.every((f) => !('roomNumber' in f)),
    ).toBe(true);
  });

  it('splits guest rooms from facilities by inventory_kind only', () => {
    expect(isGuestRoomInventoryRow('guest_room')).toBe(true);
    expect(isGuestRoomInventoryRow(null)).toBe(true);
    expect(isGuestRoomInventoryRow('conference')).toBe(false);
    expect(isGuestRoomInventoryRow('campsite')).toBe(false);
    expect(isFacilityInventoryRow('conference')).toBe(true);
    expect(isFacilityInventoryRow('campsite')).toBe(true);
  });

  it('uses internal DB keys for facilities, not guest room numbers', () => {
    expect(facilityDbRoomNumber('conference')).toBe('facility:conference');
    expect(facilityDbRoomNumber('campsite')).toBe('facility:campsite');
    expect(isLegacyFacilityDbRoomNumber('CONFERENCE-HALL')).toBe(true);
  });

  it('labels facilities without "Room …" prefix', () => {
    expect(
      getInventoryListingTitle({
        roomType: 'Conference Hall / Facilities',
        roomNumber: 'facility:conference',
        inventoryKind: 'conference',
      }),
    ).toBe('Conference Hall / Facilities');
    expect(
      getInventoryListingTitle({
        roomType: 'Standard Room (Type A)',
        roomNumber: '14',
        inventoryKind: 'guest_room',
      }),
    ).toBe('Standard Room (Type A) — Room 14');
  });

  it('allows only five guest room type labels on /rooms catalog', () => {
    expect(Object.values(HOTEL_ETUNA_ROOM_TYPES)).toHaveLength(5);
  });
});
