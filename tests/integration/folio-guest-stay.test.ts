/**
 * Folio & guest stay integration tests
 *
 * Purpose: Verify room-service folio charges, check-in gate, and settlement.
 * Location: /tests/integration/folio-guest-stay.test.ts
 */

import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { db, bookings, cmsMenuItems, menuCategories } from '@/lib/db';
import { runWithTenantContext } from '@/lib/auth/tenant-context';
import { FolioService } from '@/lib/services/folio/FolioService';
import { AppError } from '@/lib/utils/errors';
import {
  cleanupTestData,
  createTestBooking,
  createTestGuest,
  createTestProperty,
  createTestRestaurant,
  createTestRoom,
  createTestTenant,
  createTestUser,
} from '../utils/test-helpers';
import { eq } from 'drizzle-orm';

const hasDatabase = Boolean(process.env.DATABASE_URL || process.env.TEST_DATABASE_URL);

describe.skipIf(!hasDatabase)('Folio guest stay', () => {
  let tenantId: string;
  let propertyId: string;
  let roomId: string;
  let guestId: string;
  let bookingId: string;
  let menuItemId: string;
  const folioService = new FolioService();

  beforeAll(async () => {
    const tenant = await createTestTenant('Folio Guest Stay Test');
    const user = await createTestUser(tenant.id);
    const property = await createTestProperty(tenant.id, user.id, 'Folio Test Hotel');
    const room = await createTestRoom(property.id, undefined, undefined, tenant.id);
    const guest = await createTestGuest(tenant.id);
    const restaurant = await createTestRestaurant(property.id, 'Folio Bistro', tenant.id);

    tenantId = tenant.id;
    propertyId = property.id;
    roomId = room.id;
    guestId = guest.id;

    const checkIn = new Date();
    const checkOut = new Date();
    checkOut.setDate(checkOut.getDate() + 2);

    const booking = await createTestBooking(
      tenantId,
      propertyId,
      guestId,
      roomId,
      checkIn,
      checkOut
    );
    bookingId = booking.id;

    await runWithTenantContext(tenantId, async () => {
      await db
        .update(bookings)
        .set({ status: 'checked_in', totalAmount: '500.00', paymentStatus: 'paid' })
        .where(eq(bookings.id, bookingId));

      const [category] = await db
        .insert(menuCategories)
        .values({
          restaurantId: restaurant.id,
          name: 'Room Service',
          displayOrder: 1,
          isActive: true,
        })
        .returning();

      const [item] = await db
        .insert(cmsMenuItems)
        .values({
          restaurantId: restaurant.id,
          categoryId: category.id,
          name: 'Club Sandwich',
          price: '85.00',
          currency: 'NAD',
          isAvailable: true,
          displayOrder: 1,
        })
        .returning();

      menuItemId = item.id;
    });
  });

  afterAll(async () => {
    await cleanupTestData(tenantId);
  });

  it('rejects room service when booking is not checked in', async () => {
    const otherCheckIn = new Date();
    otherCheckIn.setDate(otherCheckIn.getDate() + 30);
    const otherCheckOut = new Date(otherCheckIn);
    otherCheckOut.setDate(otherCheckOut.getDate() + 2);

    const confirmed = await createTestBooking(
      tenantId,
      propertyId,
      guestId,
      roomId,
      otherCheckIn,
      otherCheckOut
    );

    await expect(
      runWithTenantContext(tenantId, () =>
        folioService.createRoomServiceOrder(confirmed.id, [
          { menuItemId, quantity: 1 },
        ])
      )
    ).rejects.toBeInstanceOf(AppError);
  });

  it('creates room service order and open fnb folio line', async () => {
    const result = await runWithTenantContext(tenantId, () =>
      folioService.createRoomServiceOrder(bookingId, [{ menuItemId, quantity: 2 }])
    );

    expect(result.order.orderType).toBe('room_service');
    expect(result.orderTotal).toBe(170);

    const folio = await runWithTenantContext(tenantId, () => folioService.getFolio(bookingId));
    expect(folio.openChargesTotal).toBeGreaterThanOrEqual(170);
    expect(folio.lines.some((l) => l.chargeType === 'fnb' && l.status === 'open')).toBe(true);
  });

  it('settles folio and awards loyalty points', async () => {
    const settlement = await runWithTenantContext(tenantId, () =>
      folioService.settleFolio(bookingId, { paymentMethod: 'cash' })
    );

    expect(settlement.amountSettled).toBeGreaterThan(0);
    expect(settlement.balanceRemaining).toBe(0);
    expect(settlement.folioClosed).toBe(true);
    expect(settlement.pointsEarned).toBeGreaterThan(0);

    const folio = await runWithTenantContext(tenantId, () => folioService.getFolio(bookingId));
    expect(folio.balanceDue).toBe(0);
    expect(folio.folioClosedAt).not.toBeNull();
  });

  it('ensureRoomChargeForBooking creates settled room line when room prepaid', async () => {
    await runWithTenantContext(tenantId, async () => {
      const [booking] = await db.select().from(bookings).where(eq(bookings.id, bookingId)).limit(1);
      const svc = new FolioService();
      await svc.ensureRoomChargeForBooking(booking);
      const folio = await svc.getFolio(bookingId);
      const roomLine = folio.lines.find((l) => l.chargeType === 'room');
      expect(roomLine).toBeDefined();
    });
  });
});
