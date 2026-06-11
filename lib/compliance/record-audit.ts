/**
 * Append-only style audit records (Drizzle `audit_trail`)
 *
 * Purpose: Court-admissible-style operational records per `001_buffr_complete_schema.sql` notes
 * Location: lib/compliance/record-audit.ts
 */

import { randomUUID } from 'node:crypto';
import type { NextRequest } from 'next/server';
import { db, auditTrail } from '@/lib/db';
import { securityLogger } from '@/lib/utils/security-logger';
import { isAuditHashChainEnabled } from '@/lib/config/compliance-flags';
import { auditHashService } from '@/lib/compliance/AuditHashService';

export function clientMetaFromRequest(req: NextRequest): {
  ip: string | null;
  userAgent: string | null;
} {
  const forwarded = req.headers.get('x-forwarded-for');
  const ip =
    forwarded?.split(',')[0]?.trim() ||
    req.headers.get('x-real-ip') ||
    null;
  const userAgent = req.headers.get('user-agent') || null;
  return { ip, userAgent };
}

export async function recordAuditTrail(input: {
  tenantId: string | null;
  userId: string | null;
  action: string;
  resourceType: string;
  resourceId?: string | null;
  oldValues?: Record<string, unknown> | null;
  newValues?: Record<string, unknown> | null;
  request?: NextRequest;
}): Promise<void> {
  const { ip, userAgent } = input.request
    ? clientMetaFromRequest(input.request)
    : { ip: null, userAgent: null };

  const id = randomUUID();
  const timestamp = new Date();
  const useHashChain =
    isAuditHashChainEnabled() && typeof input.tenantId === 'string' && input.tenantId.length > 0;

  try {
    if (useHashChain) {
      await db.transaction(async (tx) => {
        const { previousHash, eventHash } = await auditHashService.resolveHashesForInsert(
          {
            id,
            timestamp,
            tenantId: input.tenantId!,
            userId: input.userId,
            action: input.action,
            resourceType: input.resourceType,
            resourceId: input.resourceId ?? null,
            oldValues: input.oldValues ?? null,
            newValues: input.newValues ?? null,
          },
          tx
        );

        await tx.insert(auditTrail).values({
          id,
          tenantId: input.tenantId ?? undefined,
          userId: input.userId ?? undefined,
          action: input.action,
          resourceType: input.resourceType,
          resourceId: input.resourceId ?? undefined,
          oldValues: input.oldValues ?? undefined,
          newValues: input.newValues ?? undefined,
          ipAddress: ip ?? undefined,
          userAgent: userAgent ?? undefined,
          timestamp,
          previousHash,
          eventHash,
        });
      });
      return;
    }

    await db.insert(auditTrail).values({
      id,
      tenantId: input.tenantId ?? undefined,
      userId: input.userId ?? undefined,
      action: input.action,
      resourceType: input.resourceType,
      resourceId: input.resourceId ?? undefined,
      oldValues: input.oldValues ?? undefined,
      newValues: input.newValues ?? undefined,
      ipAddress: ip ?? undefined,
      userAgent: userAgent ?? undefined,
      timestamp,
    });
  } catch (err) {
    securityLogger.error('[recordAuditTrail] insert failed', err);
  }
}
