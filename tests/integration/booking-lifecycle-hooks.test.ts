/**
 * Booking status transitions → transactional email (mocked) + CRM outreach rows.
 *
 * Location: tests/integration/booking-lifecycle-hooks.test.ts
 */

import { describe, it, expect, vi, beforeAll, afterAll } from 'vitest';
import { and, eq, desc } from 'drizzle-orm';
import { db, crmOutreachTouches, setTenantContext, sql } from '@/lib/db';
import { BookingService } from '@/lib/services/booking/BookingService';
import {
  createTestTenant,
  createTestUser,
  createTestProperty,
  createTestRoom,
  createTestGuest,
  createPendingTestBooking,
  createTestBooking,
  cleanupTestData,
} from '../utils/test-helpers';

vi.mock('@/lib/services/sofia/EmailService', () => ({
  EmailService: class {
    sendEmail = vi.fn().mockResolvedValue(undefined);
  },
}));

async function waitForCampaign(
  tenantId: string,
  campaignKey: string,
  timeoutMs = 4000
): Promise<boolean> {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    const found = await db
      .select({ id: crmOutreachTouches.id })
      .from(crmOutreachTouches)
      .where(and(eq(crmOutreachTouches.tenantId, tenantId), eq(crmOutreachTouches.campaignKey, campaignKey)))
      .orderBy(desc(crmOutreachTouches.createdAt))
      .limit(1);
    if (found.length > 0) return true;
    await new Promise((r) => setTimeout(r, 100));
  }
  return false;
}

describe('Booking lifecycle hooks', () => {
  let tenantId: string;
  let propertyId: string;
  let roomId: string;
  let guestId: string;
  let bookingService: BookingService;
  let crmTablesAvailable = true;

  beforeAll(async () => {
    try {
      await db.execute(sql`SELECT 1 FROM crm_outreach_touches LIMIT 1`);
    } catch {
      crmTablesAvailable = false;
    }
    const tenant = await createTestTenant('Booking lifecycle hooks');
    const user = await createTestUser(tenant.id);
    const property = await createTestProperty(tenant.id, user.id, 'Lifecycle Hotel');
    const room = await createTestRoom(property.id, undefined, undefined, tenant.id);
    const guest = await createTestGuest(tenant.id);
    tenantId = tenant.id;
    propertyId = property.id;
    roomId = room.id;
    guestId = guest.id;
    bookingService = new BookingService();
    await setTenantContext(tenantId);
  });

  afterAll(async () => {
    await cleanupTestData(tenantId);
  });

  it('pending → confirmed creates booking_confirmed_email outreach touch', async () => {
    if (!crmTablesAvailable) return;
    const checkIn = new Date();
    checkIn.setDate(checkIn.getDate() + 40);
    const checkOut = new Date(checkIn);
    checkOut.setDate(checkOut.getDate() + 2);
    const b = await createPendingTestBooking(tenantId, propertyId, guestId, roomId, checkIn, checkOut);
    await bookingService.transitionBookingStatus(b.id, tenantId, 'confirmed');
    const ok = await waitForCampaign(tenantId, 'booking_confirmed_email');
    expect(ok).toBe(true);
  });

  it('confirmed → checked_in creates booking_checked_in_email outreach touch', async () => {
    if (!crmTablesAvailable) return;
    const checkIn = new Date();
    checkIn.setDate(checkIn.getDate() + 50);
    const checkOut = new Date(checkIn);
    checkOut.setDate(checkOut.getDate() + 2);
    const b = await createTestBooking(tenantId, propertyId, guestId, roomId, checkIn, checkOut);
    await bookingService.transitionBookingStatus(b.id, tenantId, 'checked_in');
    const ok = await waitForCampaign(tenantId, 'booking_checked_in_email');
    expect(ok).toBe(true);
  });
});
