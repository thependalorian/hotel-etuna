/**
 * RoomService - Property room operations
 * Location: /lib/services/property/RoomService.ts
 * Uses Drizzle ORM (db from @/lib/db).
 */

import { db } from '@/lib/db';
import { rooms } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import type { Room } from '@/lib/db/schema';

export class PropertyRoomService {
  async getRoomsByPropertyId(propertyId: string): Promise<Room[]> {
    try {
      const result = await db
        .select()
        .from(rooms)
        .where(
          and(
            eq(rooms.propertyId, propertyId),
            eq(rooms.status, 'available')
          )
        );
      return result;
    } catch (error) {
      console.error('Error fetching rooms by property:', error);
      throw error;
    }
  }

  async getRoomById(roomId: string, propertyId: string): Promise<Room | null> {
    try {
      const [room] = await db
        .select()
        .from(rooms)
        .where(
          and(
            eq(rooms.id, roomId),
            eq(rooms.propertyId, propertyId)
          )
        )
        .limit(1);
      return room ?? null;
    } catch (error) {
      console.error('Error fetching room by ID:', error);
      throw error;
    }
  }
}

// Backward-compatible alias. Prefer PropertyRoomService to avoid confusion with
// the route-facing lib/services/room/RoomService.ts.
export { PropertyRoomService as RoomService };
