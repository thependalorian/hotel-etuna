/**
 * Shared Data Access Layer — Rooms
 *
 * Purpose: Hub property room queries keyed by slugified room type for public URLs.
 * Location: lib/data/rooms.ts
 */

import { db } from '@/lib/db';
import { rooms } from '@/lib/db/schema';
import { asc, eq, sql } from 'drizzle-orm';
import { cache } from 'react';
import { slugify } from '@/lib/utils/slugify';
import { resolvePublicHubProperty } from '@/lib/utils/public-property';
import { securityLogger } from '@/lib/utils/security-logger';
import {
  isFacilityInventoryRow,
  isGuestRoomInventoryRow,
} from '@/lib/data/hotel-etuna-room-inventory';

type HubRoomRow = {
  id: string;
  roomNumber: string;
  roomType: string;
  floor: number | null;
  maxOccupancy: number | null;
  baseRate: string | null;
  currency: string | null;
  amenities: string[] | null;
  images: string[] | null;
  status: string | null;
  inventoryKind: string | null;
  propertyId: string;
  createdAt: Date | null;
};

export type HubRoom = ReturnType<typeof mapHubRoom>;

function mapHubRoom(row: HubRoomRow) {
  const slug = slugify(row.roomType);
  return {
    ...row,
    slug,
    name: row.roomType,
    priceFrom: row.baseRate,
    baseRate: row.baseRate ?? '0',
    isAvailable: (row.status ?? '').toLowerCase() === 'available',
    images: row.images ?? [],
    amenities: row.amenities ?? [],
    inventoryKind: row.inventoryKind ?? 'guest_room',
  };
}

function publicRoomsWhere(propertyId: string) {
  return sql`(
    ${rooms.propertyId} = ${propertyId}
    AND (
      ${rooms.status} IS NULL
      OR LOWER(${rooms.status}) NOT IN ('maintenance', 'out_of_order')
    )
  )`;
}

const hubRoomSelect = {
  id: rooms.id,
  roomNumber: rooms.roomNumber,
  roomType: rooms.roomType,
  floor: rooms.floor,
  maxOccupancy: rooms.maxOccupancy,
  baseRate: rooms.baseRate,
  currency: rooms.currency,
  amenities: rooms.amenities,
  images: rooms.images,
  status: rooms.status,
  inventoryKind: rooms.inventoryKind,
  propertyId: rooms.propertyId,
  createdAt: rooms.createdAt,
};

async function fetchHubRoomRows(propertyId: string, mode?: 'guest' | 'facility' | 'all') {
  const rows = await db
    .select(hubRoomSelect)
    .from(rooms)
    .where(publicRoomsWhere(propertyId))
    .orderBy(asc(rooms.roomType), asc(rooms.roomNumber));

  const filtered = rows.filter((row) => {
    const kind = row.inventoryKind;
    if (mode === 'guest') return isGuestRoomInventoryRow(kind);
    if (mode === 'facility') return isFacilityInventoryRow(kind);
    return true;
  });

  return filtered.map((r) => mapHubRoom(r as HubRoomRow));
}

/**
 * Guest rooms only (35 physical units) — staff tables and availability.
 */
export const getHubGuestRooms = cache(async () => {
  try {
    const { property } = await resolvePublicHubProperty();
    return await fetchHubRoomRows(property.id, 'guest');
  } catch (error) {
    securityLogger.error('[getHubGuestRooms] Error:', error);
    return [];
  }
});

/**
 * Conference + campsite inventory rows.
 */
export const getHubFacilityRooms = cache(async () => {
  try {
    const { property } = await resolvePublicHubProperty();
    return await fetchHubRoomRows(property.id, 'facility');
  } catch (error) {
    securityLogger.error('[getHubFacilityRooms] Error:', error);
    return [];
  }
});

/**
 * All hub rooms for the resolved public property (guest + facilities).
 */
export const getHubRooms = cache(async () => {
  try {
    const { property } = await resolvePublicHubProperty();
    return await fetchHubRoomRows(property.id);
  } catch (error) {
    securityLogger.error('[getHubRooms] Error:', error);
    return [];
  }
});

/**
 * Match `/rooms/[slug]` to a hub room type (first unit of that type) or room number.
 */
export const getRoomBySlug = cache(async (slug: string) => {
  const normalized = slug.trim().toLowerCase();
  const list = await getHubGuestRooms();
  const byType = list.find((r) => r.slug === normalized);
  if (byType) return byType;
  return (
    list.find(
      (r) =>
        slugify(r.roomNumber) === normalized ||
        r.roomNumber.toLowerCase() === normalized,
    ) ?? null
  );
});

export async function getFacilityRoomByKind(kind: 'conference' | 'campsite') {
  const facilities = await getHubFacilityRooms();
  return facilities.find((r) => r.inventoryKind === kind) ?? null;
}

export const getRoomAvailability = cache(
  async (roomId: string, checkIn: string, checkOut: string) => {
    try {
      const [room] = await db
        .select({
          id: rooms.id,
          status: rooms.status,
        })
        .from(rooms)
        .where(eq(rooms.id, roomId))
        .limit(1);

      const ok = (room?.status ?? '').toLowerCase() === 'available';
      return {
        available: ok,
        roomId,
        checkIn,
        checkOut,
      };
    } catch (error) {
      securityLogger.error('[getRoomAvailability] Error:', error);
      return { available: false, roomId, checkIn, checkOut };
    }
  },
);
