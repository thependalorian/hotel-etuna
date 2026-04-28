/**
 * Booking Service Integration Tests
 * 
 * Purpose: Test BookingService with actual database
 * Location: /tests/integration/bookings.test.ts
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { BookingService } from '@/lib/services/booking/BookingService';
import {
  createTestTenant,
  createTestUser,
  createTestProperty,
  createTestRoom,
  createTestGuest,
  createTestBooking,
  cleanupTestData,
} from '../utils/test-helpers';
import { setTenantContext } from '@/lib/db';

describe('BookingService Integration Tests', () => {
  let tenantId: string;
  let userId: string;
  let propertyId: string;
  let roomId: string;
  let guestId: string;
  let bookingService: BookingService;

  beforeAll(async () => {
    const tenant = await createTestTenant('Test Booking Tenant');
    const user = await createTestUser(tenant.id);
    const property = await createTestProperty(tenant.id, user.id, 'Test Hotel');
    const room = await createTestRoom(property.id, undefined, undefined, tenant.id);
    const guest = await createTestGuest(tenant.id);

    tenantId = tenant.id;
    userId = user.id;
    propertyId = property.id;
    roomId = room.id;
    guestId = guest.id;
    bookingService = new BookingService();
    await setTenantContext(tenantId);
  });

  afterAll(async () => {
    await cleanupTestData(tenantId);
  });

  describe('createBooking', () => {
    it('should create a booking successfully', async () => {
      const checkIn = new Date();
      checkIn.setDate(checkIn.getDate() + 7);
      const checkOut = new Date(checkIn);
      checkOut.setDate(checkOut.getDate() + 2);

      const booking = await bookingService.createBooking({
        checkInDate: checkIn,
        checkOutDate: checkOut,
        numGuests: 2,
        roomId: roomId,
        guestId: guestId,
      });

      expect(booking).toBeDefined();
      expect(booking.id).toBeDefined();
      expect(booking.status).toBe('confirmed');
      expect((booking as { property_id?: string; propertyId?: string }).property_id ?? (booking as { propertyId?: string }).propertyId).toBe(propertyId);
      expect((booking as { guest_id?: string; guestId?: string }).guest_id ?? (booking as { guestId?: string }).guestId).toBe(guestId);
    });

    it('should reject booking when guests exceed room capacity', async () => {
      const checkIn = new Date();
      checkIn.setDate(checkIn.getDate() + 14);
      const checkOut = new Date(checkIn);
      checkOut.setDate(checkOut.getDate() + 1);

      await expect(
        bookingService.createBooking({
          checkInDate: checkIn,
          checkOutDate: checkOut,
          numGuests: 10, // Exceeds max_occupancy of 2
          roomId: roomId,
          guestId: guestId,
        })
      ).rejects.toThrow('Number of guests exceeds room capacity');
    });

    it('should reject booking when room is already booked', async () => {
      // Create first booking
      const checkIn1 = new Date();
      checkIn1.setDate(checkIn1.getDate() + 20);
      const checkOut1 = new Date(checkIn1);
      checkOut1.setDate(checkOut1.getDate() + 3);

      await bookingService.createBooking({
        checkInDate: checkIn1,
        checkOutDate: checkOut1,
        numGuests: 2,
        roomId: roomId,
        guestId: guestId,
      });

      // Try to create overlapping booking
      const checkIn2 = new Date(checkIn1);
      checkIn2.setDate(checkIn2.getDate() + 1); // Overlaps with first booking
      const checkOut2 = new Date(checkIn2);
      checkOut2.setDate(checkOut2.getDate() + 2);

      await expect(
        bookingService.createBooking({
          checkInDate: checkIn2,
          checkOutDate: checkOut2,
          numGuests: 2,
          roomId: roomId,
          guestId: guestId,
        })
      ).rejects.toThrow('already booked');
    });
  });

  describe('getBookingsForProperty', () => {
    it('should return all bookings for a property', async () => {
      // Create multiple bookings
      const checkIn1 = new Date();
      checkIn1.setDate(checkIn1.getDate() + 30);
      const checkOut1 = new Date(checkIn1);
      checkOut1.setDate(checkOut1.getDate() + 2);

      const checkIn2 = new Date();
      checkIn2.setDate(checkIn2.getDate() + 40);
      const checkOut2 = new Date(checkIn2);
      checkOut2.setDate(checkOut2.getDate() + 3);

      await createTestBooking(tenantId, propertyId, guestId, roomId, checkIn1, checkOut1);
      await createTestBooking(tenantId, propertyId, guestId, roomId, checkIn2, checkOut2);

      const bookings = await bookingService.getBookingsForProperty(propertyId, tenantId);

      expect(bookings.length).toBeGreaterThanOrEqual(2);
      bookings.forEach((booking) => {
        expect(booking.property_id).toBe(propertyId);
        expect(booking.tenant_id).toBe(tenantId);
      });
    });

    it('should return empty array when property has no bookings', async () => {
      const emptyProperty = await createTestProperty(tenantId, userId, 'Empty Property');
      const bookings = await bookingService.getBookingsForProperty(emptyProperty.id, tenantId);
      expect(bookings).toEqual([]);
    });
  });

  describe('getBookingsByTenant', () => {
    it('should return all bookings for a tenant', async () => {
      const bookings = await bookingService.getBookingsByTenant(tenantId);

      expect(Array.isArray(bookings)).toBe(true);
      bookings.forEach((booking) => {
        expect(booking.tenant_id).toBe(tenantId);
      });
    });

    it('should filter bookings by status', async () => {
      const bookings = await bookingService.getBookingsByTenant(tenantId, {
        status: 'confirmed',
      });

      bookings.forEach((booking) => {
        expect(booking.status).toBe('confirmed');
      });
    });
  });

  describe('getBookingById', () => {
    it('should return booking by ID when it exists', async () => {
      const checkIn = new Date();
      checkIn.setDate(checkIn.getDate() + 50);
      const checkOut = new Date(checkIn);
      checkOut.setDate(checkOut.getDate() + 2);

      const booking = await createTestBooking(tenantId, propertyId, guestId, roomId, checkIn, checkOut);

      const found = await bookingService.getBookingById(booking.id, tenantId);

      expect(found).toBeDefined();
      expect(found?.id).toBe(booking.id);
    });

    it('should return null when booking does not exist', async () => {
      const found = await bookingService.getBookingById('non-existent-id', tenantId);
      expect(found).toBeNull();
    });
  });
});
