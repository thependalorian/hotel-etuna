/**
 * Room Service Integration Tests
 * 
 * Purpose: Test RoomService with actual database
 * Location: /tests/integration/rooms.test.ts
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { RoomService } from '@/lib/services/room/RoomService';
import {
  createTestTenant,
  createTestUser,
  createTestProperty,
  createTestRoom,
  cleanupTestData,
} from '../utils/test-helpers';
import { setTenantContext } from '@/lib/db';

describe('RoomService Integration Tests', () => {
  let tenantId: string;
  let userId: string;
  let propertyId: string;
  let roomService: RoomService;

  beforeAll(async () => {
    const tenant = await createTestTenant('Test Room Tenant');
    const user = await createTestUser(tenant.id);
    const property = await createTestProperty(tenant.id, user.id, 'Test Hotel');

    tenantId = tenant.id;
    userId = user.id;
    propertyId = property.id;
    roomService = new RoomService();
    await setTenantContext(tenantId);
  });

  afterAll(async () => {
    await cleanupTestData(tenantId);
  });

  describe('createRoom', () => {
    it('should create a room successfully', async () => {
      const room = await roomService.createRoom({
        room_number: '101',
        room_type: 'Standard',
        max_occupancy: 2,
        property_id: propertyId,
      });

      expect(room).toBeDefined();
      expect(room.id).toBeDefined();
      expect(room.roomNumber).toBe('101');
      expect(room.roomType).toBe('Standard');
      expect(room.maxOccupancy).toBe(2);
      expect(room.propertyId).toBe(propertyId);
    });

    it('should create room with default status AVAILABLE', async () => {
      const room = await roomService.createRoom({
        room_number: '102',
        room_type: 'Deluxe',
        max_occupancy: 4,
        property_id: propertyId,
      });

      expect(room.status).toBe('AVAILABLE');
    });

    it('should reject duplicate room numbers for same property', async () => {
      await roomService.createRoom({
        room_number: '103',
        room_type: 'Standard',
        max_occupancy: 2,
        property_id: propertyId,
      });

      await expect(
        roomService.createRoom({
          room_number: '103',
          room_type: 'Standard',
          max_occupancy: 2,
          property_id: propertyId,
        })
      ).rejects.toThrow('already exists');
    });
  });

  describe('getRoomsByProperty', () => {
    it('should return all rooms for a property', async () => {
      // Create multiple rooms
      await createTestRoom(propertyId, '201', 'Standard', tenantId);
      await createTestRoom(propertyId, '202', 'Deluxe', tenantId);
      await createTestRoom(propertyId, '203', 'Suite', tenantId);

      const rooms = await roomService.getRoomsByProperty(propertyId, tenantId);

      expect(rooms.length).toBeGreaterThanOrEqual(3);
      rooms.forEach((room) => {
        expect(room.propertyId).toBe(propertyId);
      });
    });

    it('should return empty array when property has no rooms', async () => {
      const emptyProperty = await createTestProperty(tenantId, userId, 'Empty Property');
      const rooms = await roomService.getRoomsByProperty(emptyProperty.id, tenantId);
      expect(rooms).toEqual([]);
    });
  });

  describe('searchRooms', () => {
    it('should search rooms by query string', async () => {
      await createTestRoom(propertyId, '301', 'Standard', tenantId);
      await createTestRoom(propertyId, '302', 'Deluxe', tenantId);

      const results = await roomService.searchRooms(tenantId, '301');

      expect(results.length).toBeGreaterThan(0);
      expect(results.some((r) => r.roomNumber === '301')).toBe(true);
    });

    it('should filter rooms by type', async () => {
      const results = await roomService.searchRooms(tenantId, undefined, {
        type: 'Deluxe',
      });

      results.forEach((room) => {
        expect(room.roomType).toBe('Deluxe');
      });
    });

    it('should filter rooms by capacity', async () => {
      const results = await roomService.searchRooms(tenantId, undefined, {
        capacity: 4,
      });

      results.forEach((room) => {
        expect(room.maxOccupancy).toBeGreaterThanOrEqual(4);
      });
    });
  });

  describe('getRoomStats', () => {
    it('should return room statistics', async () => {
      // Create rooms with different statuses
      await createTestRoom(propertyId, '401', 'Standard', tenantId);
      const occupiedRoom = await createTestRoom(propertyId, '402', 'Deluxe', tenantId);
      
      // Update one room to occupied
      await roomService.updateRoomStatus(occupiedRoom.id, 'OCCUPIED');

      const stats = await roomService.getRoomStats(tenantId);

      expect(stats).toBeDefined();
      expect(stats.totalRooms).toBeGreaterThan(0);
      expect(stats.availableRooms).toBeGreaterThanOrEqual(0);
      expect(stats.occupiedRooms).toBeGreaterThanOrEqual(0);
    });
  });

  describe('getRoomsForProperty', () => {
    it('should return all rooms for a property without tenant check', async () => {
      const room = await createTestRoom(propertyId, '501', 'Standard', tenantId);

      const rooms = await roomService.getRoomsForProperty(propertyId);

      expect(rooms.length).toBeGreaterThan(0);
      expect(rooms.some((r) => r.id === room.id)).toBe(true);
    });
  });
});
