/**
 * Guest pre-arrival magic link — create, verify, reuse, expiry.
 * Location: tests/integration/guest-magic-link.test.ts
 */

import crypto from 'crypto';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { neon } from '@neondatabase/serverless';
import { GuestHubMagicLinkService } from '@/lib/services/guest/GuestHubMagicLinkService';
import { AppError } from '@/lib/utils/errors';
import {
  cleanupTestData,
  createTestBooking,
  createTestGuest,
  createTestProperty,
  createTestRoom,
  createTestTenant,
  createTestUser,
} from '../utils/test-helpers';

const hasDatabase = Boolean(process.env.DATABASE_URL || process.env.TEST_DATABASE_URL);
const sqlAdmin = hasDatabase ? neon(process.env.DATABASE_URL || process.env.TEST_DATABASE_URL!) : null;

async function magicTokensTableExists(): Promise<boolean> {
  if (!sqlAdmin) return false;
  const rows = await sqlAdmin`
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'guest_hub_magic_tokens'
    LIMIT 1
  `;
  return rows.length > 0;
}

describe.skipIf(!hasDatabase)('Guest hub magic link', () => {
  let tenantId: string;
  let propertyId: string;
  let roomId: string;
  let guestId: string;
  let bookingId: string;
  let tableReady = false;

  beforeAll(async () => {
    tableReady = await magicTokensTableExists();
    if (!tableReady) return;

    const tenant = await createTestTenant('Magic Link Tenant');
    const user = await createTestUser(tenant.id);
    const property = await createTestProperty(tenant.id, user.id, 'Magic Link Hotel');
    const room = await createTestRoom(property.id, undefined, undefined, tenant.id);
    const guest = await createTestGuest(tenant.id);
    tenantId = tenant.id;
    propertyId = property.id;
    roomId = room.id;
    guestId = guest.id;

    const checkIn = new Date();
    checkIn.setDate(checkIn.getDate() + 14);
    const checkOut = new Date(checkIn);
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
  });

  afterAll(async () => {
    if (tenantId) await cleanupTestData(tenantId);
  });

  it('creates and verifies a magic link once', async () => {
    if (!tableReady) return;

    const service = new GuestHubMagicLinkService();
    const { rawToken } = await service.createForBooking(tenantId, bookingId);
    const result = await service.verifyAndConsume(rawToken);
    expect(result.bookingId).toBe(bookingId);
    expect(result.tenantId).toBe(tenantId);
  });

  it('rejects a reused token', async () => {
    if (!tableReady) return;

    const service = new GuestHubMagicLinkService();
    const { rawToken } = await service.createForBooking(tenantId, bookingId);
    await service.verifyAndConsume(rawToken);
    await expect(service.verifyAndConsume(rawToken)).rejects.toBeInstanceOf(AppError);
  });

  it('rejects an expired token', async () => {
    if (!tableReady || !sqlAdmin) return;

    const service = new GuestHubMagicLinkService();
    const { rawToken } = await service.createForBooking(tenantId, bookingId);
    const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');

    await sqlAdmin`
      UPDATE guest_hub_magic_tokens
      SET expires_at = NOW() - INTERVAL '1 hour'
      WHERE token_hash = ${tokenHash}
    `;

    await expect(service.verifyAndConsume(rawToken)).rejects.toBeInstanceOf(AppError);
  });
});
