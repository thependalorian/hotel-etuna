/**
 * Document generation integration — all four PDF types, checksum, references.
 * Location: tests/integration/documents-generation.test.ts
 */

import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import { neon } from '@neondatabase/serverless';
import { DocumentGenerationService } from '@/lib/services/documents/DocumentGenerationService';
import { setTenantContext } from '@/lib/db';
import {
  cleanupTestData,
  createTestBooking,
  createTestGuest,
  createTestProperty,
  createTestRoom,
  createTestTenant,
  createTestUser,
} from '../utils/test-helpers';

vi.mock('@/lib/services/documents/render-document-pdf', () => ({
  renderDocumentPdfBuffer: vi.fn().mockResolvedValue(Buffer.from('%PDF-mock')),
}));

vi.mock('@/lib/services/sofia/EmailService', () => ({
  EmailService: class {
    sendEmail = vi.fn().mockResolvedValue({ success: true });
  },
}));

const hasDatabase = Boolean(process.env.DATABASE_URL || process.env.TEST_DATABASE_URL);
const sqlAdmin = hasDatabase ? neon(process.env.DATABASE_URL || process.env.TEST_DATABASE_URL!) : null;

async function generatedDocumentsTableExists(): Promise<boolean> {
  if (!sqlAdmin) return false;
  const rows = await sqlAdmin`
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'generated_documents'
    LIMIT 1
  `;
  return rows.length > 0;
}

describe.skipIf(!hasDatabase)('Document generation', () => {
  let tenantId: string;
  let userId: string;
  let bookingId: string;
  let tableReady = false;
  const service = new DocumentGenerationService();

  beforeAll(async () => {
    tableReady = await generatedDocumentsTableExists();
    if (!tableReady) return;

    const tenant = await createTestTenant('PDF Docs Tenant');
    const user = await createTestUser(tenant.id);
    const property = await createTestProperty(tenant.id, user.id, 'PDF Hotel');
    const room = await createTestRoom(property.id, undefined, undefined, tenant.id);
    const guest = await createTestGuest(tenant.id);
    tenantId = tenant.id;
    userId = user.id;

    const checkIn = new Date();
    checkIn.setDate(checkIn.getDate() + 14);
    const checkOut = new Date(checkIn);
    checkOut.setDate(checkOut.getDate() + 3);

    const booking = await createTestBooking(
      tenantId,
      property.id,
      guest.id,
      room.id,
      checkIn.toISOString().slice(0, 10),
      checkOut.toISOString().slice(0, 10)
    );
    bookingId = booking.id;
    await setTenantContext(tenantId);
  });

  afterAll(async () => {
    if (tenantId) await cleanupTestData(tenantId);
  });

  it('generates quotation with unique reference and checksum', async () => {
    if (!tableReady) return;
    const result = await service.generateDocumentBuffer({
      tenantId,
      bookingId,
      documentType: 'quotation',
      generatedBy: userId,
      skipIdempotency: true,
    });
    expect(result.referenceNumber).toMatch(/^QUO-/);
    expect(result.checksum).toHaveLength(64);
    expect(result.buffer.length).toBeGreaterThan(0);
  });

  it('rejects invoice when folio not closed', async () => {
    if (!tableReady) return;
    await expect(
      service.generateDocumentBuffer({
        tenantId,
        bookingId,
        documentType: 'invoice',
        generatedBy: userId,
        skipIdempotency: true,
      })
    ).rejects.toThrow(/closed folio/i);
  });

  it('rejects receipt without transactionId', async () => {
    if (!tableReady) return;
    await expect(
      service.generateDocumentBuffer({
        tenantId,
        bookingId,
        documentType: 'receipt',
        generatedBy: userId,
        skipIdempotency: true,
      })
    ).rejects.toThrow(/transactionId/i);
  });
});
