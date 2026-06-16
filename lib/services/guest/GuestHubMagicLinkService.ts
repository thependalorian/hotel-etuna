/**
 * @fileoverview GuestHubMagicLinkService — domain service module.
 * GuestHubMagicLinkService — pre-arrival passwordless hub entry (Phase 8).
 * Location: lib/services/guest/GuestHubMagicLinkService.ts
 */

import crypto from 'crypto';
import { neon } from '@neondatabase/serverless';
import { db } from '@/lib/db';
import { sql } from 'drizzle-orm';
import { AppError, handleServiceError } from '@/lib/utils/errors';
import { runWithTenantContext } from '@/lib/auth/tenant-context';

const sqlAdmin = neon(process.env.DATABASE_URL!);

const TOKEN_TTL_HOURS = 72;

function hashToken(raw: string): string {
  return crypto.createHash('sha256').update(raw).digest('hex');
}

export type MagicLinkCreateResult = {
  rawToken: string;
  expiresAt: Date;
};

export type MagicLinkVerifyResult = {
  tenantId: string;
  bookingId: string;
};

export class GuestHubMagicLinkService {
  async createForBooking(
    tenantId: string,
    bookingId: string,
  ): Promise<MagicLinkCreateResult> {
    const rawToken = crypto.randomBytes(32).toString('base64url');
    const tokenHash = hashToken(rawToken);
    const expiresAt = new Date(Date.now() + TOKEN_TTL_HOURS * 60 * 60 * 1000);

    await runWithTenantContext(tenantId, 'hub', async () => {
      await db.execute(sql`
        INSERT INTO guest_hub_magic_tokens (
          id, tenant_id, booking_id, token_hash, expires_at, created_at
        )
        VALUES (
          gen_random_uuid(),
          ${tenantId}::uuid,
          ${bookingId}::uuid,
          ${tokenHash},
          ${expiresAt.toISOString()}::timestamptz,
          NOW()
        )
      `);
    });

    return { rawToken, expiresAt };
  }

  async verifyAndConsume(rawToken: string): Promise<MagicLinkVerifyResult> {
    try {
      const tokenHash = hashToken(rawToken.trim());
      const rows = await sqlAdmin`
        SELECT tenant_id, booking_id, expires_at, used_at
        FROM guest_hub_magic_tokens
        WHERE token_hash = ${tokenHash}
        LIMIT 1
      `;

      const row = rows[0] as {
        tenant_id: string;
        booking_id: string;
        expires_at: Date;
        used_at: Date | null;
      } | undefined;

      if (!row) {
        throw new AppError(404, 'This link is invalid or has expired.');
      }
      if (row.used_at) {
        throw new AppError(410, 'This link has already been used.');
      }
      if (new Date(row.expires_at) < new Date()) {
        throw new AppError(410, 'This link has expired. Contact us for a new one.');
      }

      await runWithTenantContext(row.tenant_id, 'hub', async () => {
        await db.execute(sql`
          UPDATE guest_hub_magic_tokens
          SET used_at = NOW()
          WHERE token_hash = ${tokenHash}
        `);
      });

      return { tenantId: row.tenant_id, bookingId: row.booking_id };
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw handleServiceError(error, 'Magic link verification failed');
    }
  }
}
