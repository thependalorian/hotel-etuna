import { describe, expect, it } from 'vitest';
import { getPublicRoomDisplay, getAllRoomsIncludedAmenities } from '@/lib/rooms/room-display';
import type { HubRoom } from '@/lib/data/rooms';

function mockRoom(overrides: Partial<HubRoom> & { slug: string; roomType: string }): HubRoom {
  return {
    id: 'test-id',
    roomNumber: 'ET-501',
    roomType: overrides.roomType,
    floor: null,
    maxOccupancy: overrides.maxOccupancy ?? 2,
    baseRate: '2000.00',
    inventoryKind: 'guest_room',
    currency: 'NAD',
    amenities: overrides.amenities ?? [],
    images: overrides.images ?? [],
    status: 'available',
    propertyId: 'prop',
    createdAt: null,
    slug: overrides.slug,
    name: overrides.roomType,
    priceFrom: '2000.00',
    isAvailable: true,
  };
}

describe('getPublicRoomDisplay', () => {
  it('shows Premiere as 4 guests even when DB says 6', () => {
    const room = mockRoom({
      slug: 'premiere-room',
      roomType: 'Premiere Room',
      maxOccupancy: 6,
    });
    const display = getPublicRoomDisplay(room);
    expect(display.displayOccupancy).toBe(4);
  });

  it('builds six photo stops for Premiere room', () => {
    const room = mockRoom({ slug: 'premiere-room', roomType: 'Premiere Room' });
    const display = getPublicRoomDisplay(room);
    expect(display.tourStops).toHaveLength(6);
    expect(display.tourStops.map((s) => s.id)).toEqual([
      'overview',
      'lounge',
      'master',
      'twins',
      'bath',
      'balcony',
    ]);
  });

  it('includes mini fridge in Premiere highlights', () => {
    const room = mockRoom({ slug: 'premiere-room', roomType: 'Premiere Room' });
    const display = getPublicRoomDisplay(room);
    expect(display.highlights).toContain('Mini fridge');
    expect(display.highlights).toContain('Private lounge');
  });
});

describe('getAllRoomsIncludedAmenities', () => {
  it('lists mini fridge first for every room strip', () => {
    const items = getAllRoomsIncludedAmenities();
    expect(items[0]?.label).toMatch(/mini fridge/i);
    expect(items.length).toBeGreaterThanOrEqual(4);
  });
});
