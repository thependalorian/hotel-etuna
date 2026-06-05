import { db, properties as propertiesSchema } from '@/lib/db';
import { AppError, handleServiceError } from '@/lib/utils/errors';
import { and, eq, sql } from 'drizzle-orm';
import type { Room } from '@/lib/db/schema';

// DTO for creating a room
export interface CreateRoomDTO {
  roomNumber: string;
  roomType: string;
  maxOccupancy: number;
  propertyId: string;
}

interface RoomSearchFilters {
  type?: string;
  capacity?: number;
}

interface RoomStats {
  totalRooms: number;
  availableRooms: number;
  occupiedRooms: number;
  occupancyRate: number;
}

export class RoomService {
  private mapRoomRow(row: Record<string, unknown>): Room {
    return {
      id: row.id as string,
      propertyId: (row.propertyId as string) ?? (row.property_id as string) ?? null,
      roomNumber: (row.roomNumber as string) ?? (row.room_number as string),
      roomType: (row.roomType as string) ?? (row.room_type as string),
      floor: (row.floor as number) ?? null,
      maxOccupancy: Number((row.maxOccupancy as number) ?? row.max_occupancy ?? 0),
      baseRate: (row.baseRate as string) ?? (row.base_rate as string) ?? null,
      currency: (row.currency as string) ?? null,
      amenities: (row.amenities as string[]) ?? null,
      images: (row.images as string[]) ?? null,
      status: (row.status as string) ?? 'available',
      inventoryKind: (row.inventoryKind as string) ?? (row.inventory_kind as string) ?? 'guest_room',
      pricingMetadata: (row.pricingMetadata as Record<string, unknown>) ?? (row.pricing_metadata as Record<string, unknown>) ?? {},
      smokingAllowed: (row.smokingAllowed as boolean) ?? (row.smoking_allowed as boolean) ?? null,
      petFriendly: (row.petFriendly as boolean) ?? (row.pet_friendly as boolean) ?? null,
      createdAt: (row.createdAt as Date) ?? (row.created_at as Date) ?? null,
      updatedAt: (row.updatedAt as Date) ?? (row.updated_at as Date) ?? null,
    };
  }
  /**
   * Get all rooms for a given property.
   */
  async getRoomsForProperty(propertyId: string): Promise<Room[]> {
    try {
      const rooms = await db.execute(sql`
        SELECT id, property_id, room_number, room_type, max_occupancy, status, created_at, updated_at
        FROM rooms
        WHERE property_id = ${propertyId}
        ORDER BY room_number ASC
      `);
      return rooms.rows.map((r) => this.mapRoomRow(r as Record<string, unknown>));
    } catch (error) {
      throw handleServiceError(error, 'Error fetching rooms for property');
    }
  }

  /**
   * Create a new room for a property.
   */
  async createRoom(data: CreateRoomDTO): Promise<Room> {
    try {
      const propertyId = (data as unknown as { propertyId?: string; property_id?: string }).propertyId
        ?? (data as unknown as { propertyId?: string; property_id?: string }).property_id;
      const roomNumber = (data as unknown as { roomNumber?: string; room_number?: string }).roomNumber
        ?? (data as unknown as { roomNumber?: string; room_number?: string }).room_number;
      const roomType = (data as unknown as { roomType?: string; room_type?: string }).roomType
        ?? (data as unknown as { roomType?: string; room_type?: string }).room_type;
      const maxOccupancy = (data as unknown as { maxOccupancy?: number; max_occupancy?: number }).maxOccupancy
        ?? (data as unknown as { maxOccupancy?: number; max_occupancy?: number }).max_occupancy
        ?? 2;

      const existing = await db.execute(sql`
        SELECT id
        FROM rooms
        WHERE property_id = ${propertyId}
          AND room_number = ${roomNumber}
        LIMIT 1
      `);

      if (existing.rows.length > 0) {
        throw new AppError(409, 'A room with this number already exists for this property.');
      }

      const newRoom = await db.execute(sql`
        INSERT INTO rooms (
          id, property_id, room_number, room_type, max_occupancy, status, created_at, updated_at
        )
        VALUES (
          gen_random_uuid(),
          ${propertyId},
          ${roomNumber},
          ${roomType},
          ${maxOccupancy},
          'AVAILABLE',
          NOW(),
          NOW()
        )
        RETURNING id, property_id, room_number, room_type, max_occupancy, status, created_at, updated_at
      `);

      return this.mapRoomRow(newRoom.rows[0] as Record<string, unknown>);
    } catch (error) {
      throw handleServiceError(error, 'Error creating room');
    }
  }

  /**
   * Get rooms by property with tenant check.
   */
  async getRoomsByProperty(propertyId: string, tenantId: string): Promise<Room[]> {
    try {
      const property = await db
        .select({ id: propertiesSchema.id })
        .from(propertiesSchema)
        .where(and(eq(propertiesSchema.id, propertyId), eq(propertiesSchema.tenantId, tenantId)))
        .limit(1);
      
      if (property.length === 0) {
        return []; // Property doesn't belong to tenant or doesn't exist
      }
      
      return this.getRoomsForProperty(propertyId);
    } catch (error) {
      throw handleServiceError(error, 'Error fetching rooms by property');
    }
  }

  /**
   * Search rooms with filters.
   */
  async searchRooms(tenantId: string, query?: string, filters?: RoomSearchFilters): Promise<Room[]> {
    try {
      const rows = await db.execute(sql`
        SELECT r.id, r.property_id, r.room_number, r.room_type, r.max_occupancy, r.status, r.created_at, r.updated_at
        FROM rooms r
        JOIN properties p ON p.id = r.property_id
        WHERE p.tenant_id = ${tenantId}
        ORDER BY r.room_number ASC
      `);
      return rows.rows
        .map((r) => this.mapRoomRow(r as Record<string, unknown>))
        .filter((room) => {
          const matchesQuery = query
            ? room.roomNumber?.toLowerCase().includes(query.toLowerCase()) ||
              room.roomType?.toLowerCase().includes(query.toLowerCase())
            : true;
          const matchesType = filters?.type ? room.roomType === filters.type : true;
          const matchesCapacity = filters?.capacity ? (room.maxOccupancy ?? 0) >= filters.capacity : true;
          return matchesQuery && matchesType && matchesCapacity;
        });
    } catch (error) {
      throw handleServiceError(error, 'Error searching rooms');
    }
  }

  /**
   * Get room statistics.
   */
  async getRoomStats(tenantId: string): Promise<RoomStats> {
    try {
      const stats = await db
        .execute(sql`
          SELECT
            COUNT(*)::int AS total_rooms,
            COUNT(CASE WHEN r.status = 'AVAILABLE' THEN 1 END)::int AS available_rooms,
            COUNT(CASE WHEN r.status = 'OCCUPIED' THEN 1 END)::int AS occupied_rooms
          FROM rooms r
          JOIN properties p ON p.id = r.property_id
          WHERE p.tenant_id = ${tenantId}
        `);

      const s = stats.rows[0] as { total_rooms: number; available_rooms: number; occupied_rooms: number };
      const totalRooms = Number(s?.total_rooms ?? 0);
      const availableRooms = Number(s?.available_rooms ?? 0);
      const occupiedRooms = Number(s?.occupied_rooms ?? 0);
      
      return {
        totalRooms,
        availableRooms,
        occupiedRooms,
        occupancyRate: totalRooms > 0 ? (occupiedRooms / totalRooms) * 100 : 0,
      };
    } catch (error) {
      throw handleServiceError(error, 'Error fetching room stats');
    }
  }

  /**
   * Update room status.
   */
  async updateRoomStatus(roomId: string, status: string): Promise<Room> {
    try {
      const updatedRooms = await db.execute(sql`
        UPDATE rooms
        SET status = ${status.toUpperCase()}, updated_at = NOW()
        WHERE id = ${roomId}
        RETURNING id, property_id, room_number, room_type, max_occupancy, status, created_at, updated_at
      `);

      if (updatedRooms.rows.length === 0) {
        throw new AppError(404, 'Room not found');
      }

      return this.mapRoomRow(updatedRooms.rows[0] as Record<string, unknown>);
    } catch (error) {
      throw handleServiceError(error, 'Error updating room status');
    }
  }
}
