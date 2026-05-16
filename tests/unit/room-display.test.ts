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
    baseRate: '2500.00',
    currency: 'NAD',
    amenities: overrides.amenities ?? [],
    images: overrides.images ?? [],
    status: 'available',
    propertyId: 'prop',
    createdAt: null,
    slug: overrides.slug,
    name: overrides.roomType,
    priceFrom: '2500.00',
    isAvailable: true,
  };
}

describe('getPublicRoomDisplay', () => {
  it('shows Premier as 4 guests even when DB says 6', () => {
    const room = mockRoom({
      slug: 'premier-room',
      roomType: 'Premier Room',
      maxOccupancy: 6,
    });
    const display = getPublicRoomDisplay(room);
    expect(display.displayOccupancy).toBe(4);
  });

  it('builds six photo stops for Premier room', () => {
    const room = mockRoom({ slug: 'premier-room', roomType: 'Premier Room' });
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

  it('includes mini fridge in Premier highlights', () => {
    const room = mockRoom({ slug: 'premier-room', roomType: 'Premier Room' });
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
