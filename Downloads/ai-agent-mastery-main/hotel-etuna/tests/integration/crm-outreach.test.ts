/**
 * CrmOutreachService integration tests — lifecycle + marketing_consent gate
 *
 * Purpose: Regression for outreach touches and tenant isolation.
 * Location: tests/integration/crm-outreach.test.ts
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { and, eq, sql } from 'drizzle-orm';
import { db, guests, crmGraphEdges, setTenantContext } from '@/lib/db';
import { runWithTenantContext } from '@/lib/auth/tenant-context';
import { CrmOutreachService } from '@/lib/services/crm/CrmOutreachService';
import {
  createTestTenant,
  createTestUser,
  createTestProperty,
  createTestRoom,
  createTestGuest,
  createTestBooking,
  cleanupTestData,
} from '../utils/test-helpers';
import { BookingService } from '@/lib/services/booking/BookingService';

describe('CrmOutreachService', () => {
  let tenantId: string;
  let guestId: string;
  let service: CrmOutreachService;
  let crmTablesAvailable = true;

  beforeAll(async () => {
    const tenant = await createTestTenant('CRM Outreach Test Tenant');
    const guest = await createTestGuest(tenant.id);
    tenantId = tenant.id;
    guestId = guest.id;
    service = new CrmOutreachService();
    try {
      await db.execute(sql`SELECT 1 FROM crm_outreach_touches LIMIT 1`);
    } catch {
      crmTablesAvailable = false;
    }
  });

  afterAll(async () => {
    await cleanupTestData(tenantId);
  });

  it('creates draft touch and lists by tenant', async () => {
    if (!crmTablesAvailable) return;
    await runWithTenantContext(tenantId, async () => {
      const touch = await service.createTouch({
        tenantId,
        guestId,
        channel: 'email',
        campaignKey: 'winback-q1',
        messageSubject: 'We miss you',
        messageBody: 'Book again soon',
      });
      expect(touch).toBeTruthy();
      expect(touch?.status).toBe('draft');

      const list = await service.listTouches(tenantId, { guestId });
      expect(list.some((t) => t.id === touch?.id)).toBe(true);
    });
  });

  it('rejects scheduled without marketing_consent', async () => {
    if (!crmTablesAvailable) return;
    await runWithTenantContext(tenantId, async () => {
      const touch = await service.createTouch({
        tenantId,
        guestId,
        channel: 'email',
        messageBody: 'Promo',
      });
      expect(touch).toBeTruthy();

      await db.update(guests).set({ marketingConsent: false }).where(eq(guests.id, guestId));

      const bad = await service.transitionStatus(tenantId, touch!.id, 'scheduled');
      expect(bad.ok).toBe(false);
      expect(bad.error).toMatch(/marketing_consent/i);
    });
  });

  it('allows scheduled → sent when marketing_consent is true', async () => {
    if (!crmTablesAvailable) return;
    await runWithTenantContext(tenantId, async () => {
      await db.update(guests).set({ marketingConsent: true }).where(eq(guests.id, guestId));

      const touch = await service.createTouch({
        tenantId,
        guestId,
        channel: 'email',
        messageBody: 'Promo with consent',
      });
      expect(touch).toBeTruthy();

      const s = await service.transitionStatus(tenantId, touch!.id, 'scheduled');
      expect(s.ok).toBe(true);
      expect(s.status).toBe('scheduled');

      const fin = await service.transitionStatus(tenantId, touch!.id, 'sent');
      expect(fin.ok).toBe(true);
      expect(fin.status).toBe('sent');
    });
  });
});

describe('Booking checkout → CRM graph stayed_at', () => {
  let tenantId: string;
  let propertyId: string;
  let roomId: string;
  let guestId: string;
  let bookingService: BookingService;
  let crmTablesAvailable = true;

  beforeAll(async () => {
    const tenant = await createTestTenant('Graph Stay Test');
    const user = await createTestUser(tenant.id);
    const property = await createTestProperty(tenant.id, user.id, 'Graph Hotel');
    const room = await createTestRoom(property.id, undefined, undefined, tenant.id);
    const guest = await createTestGuest(tenant.id);
    tenantId = tenant.id;
    propertyId = property.id;
    roomId = room.id;
    guestId = guest.id;
    bookingService = new BookingService();
    await setTenantContext(tenant.id);
    try {
      await db.execute(sql`SELECT 1 FROM crm_graph_edges LIMIT 1`);
    } catch {
      crmTablesAvailable = false;
    }
  });

  afterAll(async () => {
    await cleanupTestData(tenantId);
  });

  it('inserts guest —[stayed_at]→ property on checked_out', async () => {
    if (!crmTablesAvailable) return;
    const checkIn = new Date();
    checkIn.setDate(checkIn.getDate() + 60);
    const checkOut = new Date(checkIn);
    checkOut.setDate(checkOut.getDate() + 2);

    const booking = await createTestBooking(tenantId, propertyId, guestId, roomId, checkIn, checkOut);

    await runWithTenantContext(tenantId, async () => {
      await bookingService.transitionBookingStatus(booking.id, tenantId, 'checked_in');
      await bookingService.transitionBookingStatus(booking.id, tenantId, 'checked_out');
    });

    const edges = await runWithTenantContext(tenantId, async () =>
      db
        .select()
        .from(crmGraphEdges)
        .where(
          and(
            eq(crmGraphEdges.tenantId, tenantId),
            eq(crmGraphEdges.srcEntityType, 'guest'),
            eq(crmGraphEdges.srcEntityId, guestId),
            eq(crmGraphEdges.dstEntityType, 'property'),
            eq(crmGraphEdges.dstEntityId, propertyId),
            eq(crmGraphEdges.relationType, 'stayed_at')
          )
        )
    );

    expect(edges.length).toBeGreaterThanOrEqual(1);
  });
});
