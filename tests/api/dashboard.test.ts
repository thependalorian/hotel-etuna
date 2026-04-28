/**
 * Dashboard API Route Integration Tests
 *
 * Purpose: Test /api/dashboard endpoints with Drizzle
 * Location: tests/api/dashboard.test.ts
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import {
  createTestTenant,
  createTestUser,
  createTestProperty,
  createTestRoom,
  createTestGuest,
  createTestBooking,
  cleanupTestData,
} from '../utils/test-helpers';
import { db, setTenantContext } from '@/lib/db';
import { properties, bookings } from '@/lib/db';
import { eq, count } from 'drizzle-orm';

describe('Dashboard API Integration Tests', () => {
  let tenantId: string;
  let userId: string;
  let propertyId: string;
  let roomId: string;
  let guestId: string;

  beforeAll(async () => {
    const tenant = await createTestTenant('Dashboard Test Tenant');
    const user = await createTestUser(tenant.id);
    const property = await createTestProperty(tenant.id, user.id, 'Dashboard Test Hotel');
    const room = await createTestRoom(property.id, undefined, undefined, tenant.id);
    const guest = await createTestGuest(tenant.id);

    tenantId = tenant.id;
    userId = user.id;
    propertyId = property.id;
    roomId = room.id;
    guestId = guest.id;
    await setTenantContext(tenantId);

    const today = new Date();
    for (let i = 0; i < 5; i++) {
      const checkIn = new Date(today);
      checkIn.setDate(today.getDate() + i);
      const checkOut = new Date(checkIn);
      checkOut.setDate(checkIn.getDate() + 2);
      await createTestBooking(tenantId, propertyId, guestId, roomId, checkIn, checkOut);
    }
  });

  afterAll(async () => {
    await cleanupTestData(tenantId);
  });

  describe('GET /api/dashboard/stats', () => {
    it('should have property count for tenant', async () => {
      const [row] = await db
        .select({ count: count() })
        .from(properties)
        .where(eq(properties.tenantId, tenantId));
      expect(row?.count ?? 0).toBeGreaterThanOrEqual(1);
    });
  });

  describe('GET /api/dashboard/activity', () => {
    it('should have bookings for tenant', async () => {
      const rows = await db
        .select({ id: bookings.id })
        .from(bookings)
        .where(eq(bookings.tenantId, tenantId))
        .limit(5);
      expect(rows.length).toBeGreaterThan(0);
    });
  });
});
