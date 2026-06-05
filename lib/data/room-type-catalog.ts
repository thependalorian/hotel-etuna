/**
 * Marketing catalog — one card per room_type (5 categories), not per physical unit.
 * Location: lib/data/room-type-catalog.ts
 */

import { cache } from 'react';
import { getHubGuestRooms, type HubRoom } from '@/lib/data/rooms';
import { slugify } from '@/lib/utils/slugify';
import { HOTEL_ETUNA_ROOM_TYPES } from '@/lib/constants/hotel-etuna-room-types';

/** Only these five labels appear on `/` and `/rooms` (one card each). */
const GUEST_ROOM_TYPE_LABELS = new Set<string>(Object.values(HOTEL_ETUNA_ROOM_TYPES));

export type HubRoomTypeCatalogEntry = HubRoom & {
  unitCount: number;
  roomNumbers: string[];
};

export const getHubRoomTypeCatalog = cache(async (): Promise<HubRoomTypeCatalogEntry[]> => {
  const guestRooms = await getHubGuestRooms();
  const byType = new Map<string, HubRoom[]>();

  for (const room of guestRooms) {
    if (!GUEST_ROOM_TYPE_LABELS.has(room.roomType)) continue;
    const key = room.roomType;
    const list = byType.get(key) ?? [];
    list.push(room);
    byType.set(key, list);
  }

  const catalog: HubRoomTypeCatalogEntry[] = [];

  for (const [, units] of byType) {
    const sorted = [...units].sort((a, b) => a.baseRate.localeCompare(b.baseRate));
    const representative = sorted[0];
    catalog.push({
      ...representative,
      slug: slugify(representative.roomType),
      unitCount: units.length,
      roomNumbers: units.map((u) => u.roomNumber).sort((a, b) => a.localeCompare(b, undefined, { numeric: true })),
      priceFrom: sorted.reduce((min, r) => {
        const rate = parseFloat(r.baseRate ?? '0');
        const current = parseFloat(min ?? '999999');
        return rate < current ? r.baseRate : min;
      }, representative.baseRate),
    });
  }

  return catalog.sort((a, b) => parseFloat(a.priceFrom ?? '0') - parseFloat(b.priceFrom ?? '0'));
});
