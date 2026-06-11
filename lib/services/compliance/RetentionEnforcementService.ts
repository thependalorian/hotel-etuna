/**
 * RetentionEnforcementService — enforce data-retention expiry.
 * Location: lib/services/compliance/RetentionEnforcementService.ts
 *
 * `record_retention_audit` rows carry a `retention_expires_at` and an explicit human
 * `deletion_approved_by` gate. This job does NOT delete guest data — it flags expired,
 * still-active records (status 'active' → 'expired') so they surface for deletion review.
 * The actual purge happens only after approval, elsewhere. Dry-run is the DEFAULT.
 */

import { db } from '@/lib/db';
import { recordRetentionAudit, auditTrail } from '@/lib/db/schema';
import { and, eq, lte, sql } from 'drizzle-orm';
import { securityLogger } from '@/lib/utils/security-logger';

export interface RetentionEnforcementResult {
  dryRun: boolean;
  expiredCount: number;
  byRecordType: Record<string, number>;
  flagged: number;
  ranAt: string;
}

export class RetentionEnforcementService {
  /**
   * Flag retention records whose retention window has elapsed.
   * @param dryRun default TRUE — only counts; nothing is changed.
   */
  static async enforce(
    { dryRun = true, tenantId }: { dryRun?: boolean; tenantId?: string } = {},
  ): Promise<RetentionEnforcementResult> {
    const now = new Date();

    const baseWhere = tenantId
      ? and(
          eq(recordRetentionAudit.status, 'active'),
          lte(recordRetentionAudit.retentionExpiresAt, now),
          eq(recordRetentionAudit.tenantId, tenantId),
        )
      : and(
          eq(recordRetentionAudit.status, 'active'),
          lte(recordRetentionAudit.retentionExpiresAt, now),
        );

    const expired = await db
      .select({
        id: recordRetentionAudit.id,
        tenantId: recordRetentionAudit.tenantId,
        recordType: recordRetentionAudit.recordType,
        recordId: recordRetentionAudit.recordId,
      })
      .from(recordRetentionAudit)
      .where(baseWhere);

    const byRecordType: Record<string, number> = {};
    for (const row of expired) {
      byRecordType[row.recordType] = (byRecordType[row.recordType] ?? 0) + 1;
    }

    let flagged = 0;
    if (!dryRun && expired.length > 0) {
      // Transition to 'expired' (awaiting deletion approval). No underlying data is removed.
      const updated = await db
        .update(recordRetentionAudit)
        .set({ status: 'expired' })
        .where(baseWhere)
        .returning({ id: recordRetentionAudit.id });
      flagged = updated.length;

      // One audit row summarising the run (avoids a write per record).
      const tenantForAudit = tenantId ?? expired[0]?.tenantId;
      if (tenantForAudit) {
        await db.insert(auditTrail).values({
          tenantId: tenantForAudit,
          action: 'compliance.retention.flagged_expired',
          resourceType: 'record_retention_audit',
          newValues: { flagged, byRecordType },
        });
      }
    }

    const result: RetentionEnforcementResult = {
      dryRun,
      expiredCount: expired.length,
      byRecordType,
      flagged,
      ranAt: now.toISOString(),
    };

    securityLogger.info('[RetentionEnforcement] run', { ...result });
    return result;
  }

  /** Quick counter for dashboards: how many records are past retention and still active. */
  static async expiredCount(tenantId?: string): Promise<number> {
    const now = new Date();
    const where = tenantId
      ? and(
          eq(recordRetentionAudit.status, 'active'),
          lte(recordRetentionAudit.retentionExpiresAt, now),
          eq(recordRetentionAudit.tenantId, tenantId),
        )
      : and(
          eq(recordRetentionAudit.status, 'active'),
          lte(recordRetentionAudit.retentionExpiresAt, now),
        );
    const [row] = await db
      .select({ n: sql<number>`count(*)::int` })
      .from(recordRetentionAudit)
      .where(where);
    return row?.n ?? 0;
  }
}
