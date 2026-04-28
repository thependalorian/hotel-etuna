/**
 * Shared Data Access Layer — Rooms
 * 
 * Purpose: Single source of truth for room queries
 * Location: lib/data/rooms.ts
 * 
 * Features:
 * - getHubRooms() — Fetch all Hotel Etuna hub rooms
 * - getRoomBySlug(slug) — Fetch single room by slug
 * - Eliminates DRY violations across pages
 * - Consistent query structure
 * 
 * @version 1.0.0
 * @since April 28, 2026
 */

import { db } from '@/lib/db';
import { rooms, properties, tenants } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { cache } from 'react';

const HUB_TENANT_ID = process.env.HUB_TENANT_ID!;
const DEFAULT_PROPERTY_ID = process.env.DEFAULT_PROPERTY_ID!;

/**
 * Get all Hotel Etuna hub rooms
 * Cached using React cache() for request deduplication
 */
export const getHubRooms = cache(async () => {
  try {
    const hubRooms = await db
      .select({
        id: rooms.id,
        name: rooms.name,
        slug: rooms.slug,
        description: rooms.description,
        maxOccupancy: rooms.maxOccupancy,
        bedType: rooms.bedType,
        amenities: rooms.amenities,
        images: rooms.images,
        priceFrom: rooms.pricePerNight,
        currency: rooms.currency,
        isAvailable: rooms.isAvailable,
        roomType: rooms.roomType,
        squareMeters: rooms.squareMeters,
        viewType: rooms.viewType,
        propertyId: rooms.propertyId,
        createdAt: rooms.createdAt,
      })
      .from(rooms)
      .innerJoin(properties, eq(rooms.propertyId, properties.id))
      .where(
        and(
          eq(properties.tenantId, HUB_TENANT_ID),
          eq(rooms.propertyId, DEFAULT_PROPERTY_ID),
          eq(rooms.isAvailable, true)
        )
      )
      .orderBy(rooms.roomType, rooms.pricePerNight);

    return hubRooms;
  } catch (error) {
    console.error('[getHubRooms] Error:', error);
    return [];
  }
});

/**
 * Get single room by slug
 * Cached using React cache() for request deduplication
 */
export const getRoomBySlug = cache(async (slug: string) => {
  try {
    const [room] = await db
      .select({
        id: rooms.id,
        name: rooms.name,
        slug: rooms.slug,
        description: rooms.description,
        maxOccupancy: rooms.maxOccupancy,
        bedType: rooms.bedType,
        amenities: rooms.amenities,
        images: rooms.images,
        priceFrom: rooms.pricePerNight,
        currency: rooms.currency,
        isAvailable: rooms.isAvailable,
        roomType: rooms.roomType,
        squareMeters: rooms.squareMeters,
        viewType: rooms.viewType,
        bathType: rooms.bathType,
        roomNumber: rooms.roomNumber,
        propertyId: rooms.propertyId,
        createdAt: rooms.createdAt,
        // Additional details for single room view
        longDescription: rooms.longDescription,
        highlights: rooms.highlights,
      })
      .from(rooms)
      .innerJoin(properties, eq(rooms.propertyId, properties.id))
      .where(
        and(
          eq(rooms.slug, slug),
          eq(properties.tenantId, HUB_TENANT_ID),
          eq(rooms.propertyId, DEFAULT_PROPERTY_ID)
        )
      )
      .limit(1);

    return room || null;
  } catch (error) {
    console.error('[getRoomBySlug] Error:', error);
    return null;
  }
});

/**
 * Get room availability for a date range
 * (Future enhancement - currently rooms are just marked available/unavailable)
 */
export const getRoomAvailability = cache(async (
  roomId: string,
  checkIn: string,
  checkOut: string
) => {
  try {
    const [room] = await db
      .select({
        id: rooms.id,
        isAvailable: rooms.isAvailable,
      })
      .from(rooms)
      .where(eq(rooms.id, roomId))
      .limit(1);

    // TODO: Check against bookings table for date conflicts
    // For now, just return the room's availability status
    return {
      available: room?.isAvailable ?? false,
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
});

/**
 * Type exports for consumers
 */
export type HubRoom = Awaited<ReturnType<typeof getHubRooms>>[0];
export type RoomDetail = Awaited<ReturnType<typeof getRoomBySlug>>;
