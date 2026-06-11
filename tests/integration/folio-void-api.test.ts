/**
 * Folio void API integration tests (OSS W5).
 * Location: tests/integration/folio-void-api.test.ts
 */

import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { runWithTenantContext } from '@/lib/auth/tenant-context';
import { db, bookingCharges, bookings } from '@/lib/db';
import { eq, sql } from 'drizzle-orm';
import { POST } from '@/app/api/folio/charges/[id]/void/route';
import {
  cleanupTestData,
  createTestBooking,
  createTestGuest,
  createTestProperty,
  createTestRoom,
  createTestTenant,
  createTestUser,
} from '../utils/test-helpers';

const { mockGetAuthenticatedUser } = vi.hoisted(() => ({
  mockGetAuthenticatedUser: vi.fn(),
}));

vi.mock('@/lib/utils/api-helpers', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/utils/api-helpers')>();
  const { runWithTenantContext: withTenant } = await import('@/lib/auth/tenant-context');
  return {
    ...actual,
    getAuthenticatedUser: (...args: unknown[]) => mockGetAuthenticatedUser(...args),
    withApiAuth: async (
      req: NextRequest,
      handler: (req: NextRequest, user: Awaited<ReturnType<typeof mockGetAuthenticatedUser>>) => Promise<Response>,
      options?: { requireRole?: string[]; rateLimit?: boolean }
    ) => {
      try {
        const user = await mockGetAuthenticatedUser(req);
        if (!user) {
          return actual.errorResponse('Unauthorized', 401, 'UNAUTHORIZED');
        }
        if (options?.requireRole && (!user.role || !options.requireRole.includes(user.role))) {
          return actual.errorResponse('Forbidden', 403, 'FORBIDDEN');
        }
        return await withTenant(user.tenantId ?? undefined, 'hub', () => handler(req, user));
      } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        if (message === 'Unauthorized') {
          return actual.errorResponse('Unauthorized', 401, 'UNAUTHORIZED');
        }
        if (message === 'Forbidden') {
          return actual.errorResponse('Forbidden', 403, 'FORBIDDEN');
        }
        return actual.errorResponse('Internal server error', 500, 'INTERNAL_ERROR');
      }
    },
  };
});

const hasDatabase = Boolean(process.env.DATABASE_URL || process.env.TEST_DATABASE_URL);

describe.skipIf(!hasDatabase)('Folio void API', { timeout: 120_000 }, () => {
  let tenantId: string;
  let userId: string;
  let bookingId: string;
  let chargeId: string;

  beforeAll(async () => {
    // Ensure W5 migration enum value exists on test Neon branch
    await db.execute(sql`
      DO $$ BEGIN
        ALTER TYPE booking_charge_status ADD VALUE 'voided';
      EXCEPTION
        WHEN duplicate_object THEN NULL;
      END $$;
    `);

    const tenant = await createTestTenant('Folio Void API Tenant');
    const user = await createTestUser(tenant.id);
    const property = await createTestProperty(tenant.id, user.id, 'Void API Hotel');
    const room = await createTestRoom(property.id, undefined, undefined, tenant.id);
    const guest = await createTestGuest(tenant.id);

    tenantId = tenant.id;
    userId = user.id;

    const checkIn = new Date();
    const checkOut = new Date();
    checkOut.setDate(checkOut.getDate() + 2);

    const booking = await createTestBooking(
      tenantId,
      property.id,
      guest.id,
      room.id,
      checkIn,
      checkOut
    );
    bookingId = booking.id;

    await runWithTenantContext(tenantId, async () => {
      await db
        .update(bookings)
        .set({ status: 'checked_in' })
        .where(eq(bookings.id, bookingId));

      const [charge] = await db
        .insert(bookingCharges)
        .values({
          tenantId,
          bookingId,
          chargeType: 'fnb',
          description: 'Minibar snack',
          amount: '45.00',
          currency: 'NAD',
          status: 'open',
        })
        .returning();

      chargeId = charge!.id;
    });
  });

  afterAll(async () => {
    await cleanupTestData(tenantId);
  });

  it('voids an open charge with reason code and creates reversal', async () => {
    mockGetAuthenticatedUser.mockResolvedValue({
      id: userId,
      tenantId,
      role: 'admin',
      email: 'manager@test.com',
    });

    const req = new NextRequest(`http://localhost/api/folio/charges/${chargeId}/void`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reasonCode: 'duplicate_charge', remark: 'Posted twice' }),
    });

    const res = await POST(req, { params: Promise.resolve({ id: chargeId }) });
    const json = await res.json();

    expect(res.status, JSON.stringify(json)).toBe(200);
    expect(json.data?.originalCharge?.status).toBe('voided');
    expect(json.data?.reversalCharge?.amount).toBe('-45.00');

    await runWithTenantContext(tenantId, async () => {
      const lines = await db
        .select()
        .from(bookingCharges)
        .where(eq(bookingCharges.bookingId, bookingId));

      const reversal = lines.find((l) => l.chargeType === 'adjustment' && l.amount === '-45.00');
      expect(reversal).toBeDefined();
      expect(reversal?.description).toContain('duplicate_charge');
    });
  });

  it('rejects void without auth', async () => {
    mockGetAuthenticatedUser.mockResolvedValue(null);

    const req = new NextRequest(`http://localhost/api/folio/charges/${chargeId}/void`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reasonCode: 'staff_error' }),
    });

    const res = await POST(req, { params: Promise.resolve({ id: chargeId }) });
    expect(res.status).toBe(401);
  });

  it('rejects invalid reason code', async () => {
    mockGetAuthenticatedUser.mockResolvedValue({
      id: userId,
      tenantId,
      role: 'admin',
      email: 'manager@test.com',
    });

    const req = new NextRequest(`http://localhost/api/folio/charges/${chargeId}/void`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reasonCode: 'not_a_real_code' }),
    });

    const res = await POST(req, { params: Promise.resolve({ id: chargeId }) });
    expect(res.status).toBe(400);
  });
});
