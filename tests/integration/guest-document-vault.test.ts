/**
 * Guest document vault — encrypted store + list per booking.
 * Location: tests/integration/guest-document-vault.test.ts
 */

import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { neon } from '@neondatabase/serverless';
import { GuestDocumentVaultService } from '@/lib/services/guest/GuestDocumentVaultService';
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

async function documentsTableExists(): Promise<boolean> {
  if (!sqlAdmin) return false;
  const rows = await sqlAdmin`
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'guest_documents'
    LIMIT 1
  `;
  return rows.length > 0;
}

describe.skipIf(!hasDatabase)('Guest document vault', () => {
  let tenantId: string;
  let bookingId: string;
  let tableReady = false;

  beforeAll(async () => {
    if (!process.env.ENCRYPTION_KEY) {
      process.env.ENCRYPTION_KEY = 'a'.repeat(64);
    }
    tableReady = await documentsTableExists();
    if (!tableReady) return;

    const tenant = await createTestTenant('Document Vault Tenant');
    const user = await createTestUser(tenant.id);
    const property = await createTestProperty(tenant.id, user.id, 'Vault Hotel');
    const room = await createTestRoom(property.id, undefined, undefined, tenant.id);
    const guest = await createTestGuest(tenant.id);
    tenantId = tenant.id;

    const checkIn = new Date();
    checkIn.setDate(checkIn.getDate() + 7);
    const checkOut = new Date(checkIn);
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
  });

  afterAll(async () => {
    if (tenantId) await cleanupTestData(tenantId);
  });

  it('stores and lists document metadata without exposing ciphertext', async () => {
    if (!tableReady) return;

    const vault = new GuestDocumentVaultService();
    const stored = await vault.storeDocument({
      tenantId,
      bookingId,
      guestId: null,
      docType: 'passport',
      fileName: 'passport.pdf',
      mimeType: 'application/pdf',
      base64Content: Buffer.from('fake-pdf-content').toString('base64'),
    });

    expect(stored.fileName).toBe('passport.pdf');
    expect(stored.docType).toBe('passport');

    const list = await vault.listForBooking(tenantId, bookingId);
    expect(list.some((d) => d.id === stored.id)).toBe(true);
    expect(JSON.stringify(list)).not.toContain('fake-pdf-content');
  });
});
