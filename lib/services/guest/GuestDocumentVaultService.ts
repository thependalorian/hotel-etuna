/**
 * GuestDocumentVaultService — encrypted ID/visa storage per stay (Phase 8).
 * Location: lib/services/guest/GuestDocumentVaultService.ts
 */

import { db } from '@/lib/db';
import { sql } from 'drizzle-orm';
import { AppError } from '@/lib/utils/errors';
import { runWithTenantContext } from '@/lib/auth/tenant-context';
import { EncryptionService } from '@/lib/services/security/EncryptionService';

export type GuestDocumentType = 'national_id' | 'passport' | 'visa' | 'other';

export type GuestDocumentMeta = {
  id: string;
  docType: GuestDocumentType;
  fileName: string;
  mimeType: string;
  createdAt: string;
};

const MAX_BYTES = 5 * 1024 * 1024;

export class GuestDocumentVaultService {
  async listForBooking(tenantId: string, bookingId: string): Promise<GuestDocumentMeta[]> {
    return runWithTenantContext(tenantId, 'hub', async () => {
      const rows = await db.execute(sql`
        SELECT id, doc_type, file_name, mime_type, created_at
        FROM guest_documents
        WHERE tenant_id = ${tenantId}::uuid
          AND booking_id = ${bookingId}::uuid
        ORDER BY created_at DESC
      `);
      return rows.rows.map((r) => {
        const row = r as Record<string, unknown>;
        return {
          id: String(row.id),
          docType: String(row.doc_type) as GuestDocumentType,
          fileName: String(row.file_name),
          mimeType: String(row.mime_type),
          createdAt: String(row.created_at),
        };
      });
    });
  }

  async storeDocument(input: {
    tenantId: string;
    bookingId: string;
    guestId?: string | null;
    docType: GuestDocumentType;
    fileName: string;
    mimeType: string;
    base64Content: string;
  }): Promise<GuestDocumentMeta> {
    if (input.base64Content.length > MAX_BYTES * 1.4) {
      throw new AppError(400, 'File too large (max 5MB).');
    }

    const encrypted = EncryptionService.encrypt(input.base64Content);
    const retention = new Date();
    retention.setFullYear(retention.getFullYear() + 2);

    return runWithTenantContext(input.tenantId, 'hub', async () => {
      const rows = await db.execute(sql`
        INSERT INTO guest_documents (
          id, tenant_id, booking_id, guest_id, doc_type, file_name, mime_type,
          encrypted_payload, encryption_iv, encryption_auth_tag, retention_until, created_at, updated_at
        )
        VALUES (
          gen_random_uuid(),
          ${input.tenantId}::uuid,
          ${input.bookingId}::uuid,
          ${input.guestId ?? null},
          ${input.docType}::guest_document_type,
          ${input.fileName},
          ${input.mimeType},
          ${encrypted.encrypted},
          ${encrypted.iv},
          ${encrypted.authTag},
          ${retention.toISOString().slice(0, 10)}::date,
          NOW(),
          NOW()
        )
        RETURNING id, doc_type, file_name, mime_type, created_at
      `);

      const row = rows.rows[0] as Record<string, unknown>;
      if (!row) throw new AppError(500, 'Could not store document');

      return {
        id: String(row.id),
        docType: String(row.doc_type) as GuestDocumentType,
        fileName: String(row.file_name),
        mimeType: String(row.mime_type),
        createdAt: String(row.created_at),
      };
    });
  }
}
