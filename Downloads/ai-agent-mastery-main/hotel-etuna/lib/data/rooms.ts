import { and, eq, inArray } from 'drizzle-orm';
import { db, roomRates, rooms } from '@/lib/db';
import { resolvePublicHubProperty } from '@/lib/utils/public-property';
import { slugify } from '@/lib/utils/slugify';

export type PublicRoom = {
  id: string;
  slug: string;
  roomType: string;
  maxOccupancy: number;
  amenities: string[];
  images: string[];
  priceAmount: number | null;
  currency: string;
};

function mapRoomWithRate(
  room: {
    id: string;
    roomType: string;
    maxOccupancy: number | null;
    amenities: string[] | null;
    images: string[] | null;
    baseRate: string | null;
    currency: string | null;
  },
  ratesByRoomId: Map<string, { amount: number; currency: string }>
): PublicRoom {
  const explicitRate = ratesByRoomId.get(room.id);
  const baseRate = room.baseRate ? Number(room.baseRate) : null;
  const parsedBaseRate = baseRate !== null && !Number.isNaN(baseRate) ? baseRate : null;

  return {
    id: room.id,
    slug: slugify(room.roomType),
    roomType: room.roomType,
    maxOccupancy: room.maxOccupancy ?? 2,
    amenities: room.amenities ?? [],
    images: room.images ?? [],
    priceAmount: explicitRate?.amount ?? parsedBaseRate,
    currency: explicitRate?.currency ?? room.currency ?? 'NAD',
  };
}

export async function getHubRooms(): Promise<PublicRoom[]> {
  const { property } = await resolvePublicHubProperty();
  const roomRows = await db
    .select({
      id: rooms.id,
      roomType: rooms.roomType,
      maxOccupancy: rooms.maxOccupancy,
      amenities: rooms.amenities,
      images: rooms.images,
      baseRate: rooms.baseRate,
      currency: rooms.currency,
    })
    .from(rooms)
    .where(eq(rooms.propertyId, property.id));

  const roomIds = roomRows.map((room) => room.id);
  const rateRows = roomIds.length
    ? await db
        .select({
          roomId: roomRates.roomId,
          amount: roomRates.rateAmount,
          currency: roomRates.currency,
        })
        .from(roomRates)
        .where(and(inArray(roomRates.roomId, roomIds), eq(roomRates.isDefault, true)))
    : [];

  const ratesByRoomId = new Map<string, { amount: number; currency: string }>();
  for (const rateRow of rateRows) {
    if (!rateRow.roomId) continue;
    const parsedAmount = Number(rateRow.amount);
    if (Number.isNaN(parsedAmount)) continue;
    ratesByRoomId.set(rateRow.roomId, {
      amount: parsedAmount,
      currency: rateRow.currency ?? 'NAD',
    });
  }

  return roomRows
    .map((room) => mapRoomWithRate(room, ratesByRoomId))
    .sort((a, b) => a.roomType.localeCompare(b.roomType));
}

export async function getRoomBySlug(slug: string): Promise<PublicRoom | null> {
  const roomsList = await getHubRooms();
  return roomsList.find((room) => room.slug === slug) ?? null;
}
