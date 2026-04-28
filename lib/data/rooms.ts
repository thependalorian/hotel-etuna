/**
 * Shared Data Access Layer — Rooms
 *
 * Purpose: Hub property room queries keyed by slugified room type for public URLs.
 * Location: lib/data/rooms.ts
 */

import { db } from '@/lib/db';
import { rooms, properties } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { cache } from 'react';
import { slugify } from '@/lib/utils/slugify';

const HUB_TENANT_ID = process.env.HUB_TENANT_ID!;
const DEFAULT_PROPERTY_ID = process.env.DEFAULT_PROPERTY_ID!;

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
  propertyId: string;
  createdAt: Date | null;
};

function mapHubRoom(row: HubRoomRow) {
  const slug = slugify(row.roomType);
  return {
    ...row,
    slug,
    name: row.roomType,
    priceFrom: row.baseRate,
    isAvailable: (row.status ?? '').toLowerCase() === 'available',
    images: row.images ?? [],
    amenities: row.amenities ?? [],
  };
}

/**
 * All published hub rooms for the default landing property.
 */
export const getHubRooms = cache(async () => {
  try {
    const rows = await db
      .select({
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
        propertyId: rooms.propertyId,
        createdAt: rooms.createdAt,
      })
      .from(rooms)
      .innerJoin(properties, eq(rooms.propertyId, properties.id))
      .where(
        and(
          eq(properties.tenantId, HUB_TENANT_ID),
          eq(rooms.propertyId, DEFAULT_PROPERTY_ID),
          eq(rooms.status, 'available'),
        ),
      )
      .orderBy(rooms.roomType, rooms.baseRate);

    return rows.map((r) => mapHubRoom(r as HubRoomRow));
  } catch (error) {
    console.error('[getHubRooms] Error:', error);
    return [];
  }
});

/**
 * Match `/rooms/[slug]` to a hub room by slugified room type or room number.
 */
export const getRoomBySlug = cache(async (slug: string) => {
  const normalized = slug.trim().toLowerCase();
  const list = await getHubRooms();
  return (
    list.find(
      (r) =>
        r.slug === normalized ||
        slugify(r.roomNumber) === normalized ||
        r.roomNumber.toLowerCase() === normalized,
    ) ?? null
  );
});

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
      console.error('[getRoomAvailability] Error:', error);
      return {
        available: false,
        roomId,
        checkIn,
        checkOut,
      };
    }
  },
);

export type HubRoom = Awaited<ReturnType<typeof getHubRooms>>[0];
export type RoomDetail = Awaited<ReturnType<typeof getRoomBySlug>>;
