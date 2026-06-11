/**
 * SofiaChatRetentionService — purge ai_conversations older than 24 months.
 * Location: lib/services/compliance/SofiaChatRetentionService.ts
 * Policy: DATA_RETENTION_POLICY.md — Sofia chat 24 months
 */

import { db } from '@/lib/db';
import { aiConversations, auditTrail } from '@/lib/db/schema';
import { and, eq, lte, sql } from 'drizzle-orm';
import { securityLogger } from '@/lib/utils/security-logger';

const RETENTION_MONTHS = 24;

export interface SofiaRetentionResult {
  dryRun: boolean;
  cutoffIso: string;
  conversationCount: number;
  deleted: number;
  ranAt: string;
}

export class SofiaChatRetentionService {
  static getCutoffDate(): Date {
    const d = new Date();
    d.setMonth(d.getMonth() - RETENTION_MONTHS);
    return d;
  }

  static async enforce(
    { dryRun = true, tenantId }: { dryRun?: boolean; tenantId?: string } = {}
  ): Promise<SofiaRetentionResult> {
    const cutoff = this.getCutoffDate();

    const whereClause = tenantId
      ? and(lte(aiConversations.createdAt, cutoff), eq(aiConversations.tenantId, tenantId))
      : lte(aiConversations.createdAt, cutoff);

    const countResult = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(aiConversations)
      .where(whereClause);

    const conversationCount = countResult[0]?.count ?? 0;
    let deleted = 0;

    if (!dryRun && conversationCount > 0) {
      const removed = await db
        .delete(aiConversations)
        .where(whereClause)
        .returning({ id: aiConversations.id });

      deleted = removed.length;

      if (tenantId && deleted > 0) {
        await db.insert(auditTrail).values({
          tenantId,
          action: 'compliance.sofia_chat.purged',
          resourceType: 'ai_conversations',
          newValues: { deleted, cutoff: cutoff.toISOString() },
        });
      }

      securityLogger.info('[SofiaRetention] purged conversations', {
        deleted,
        cutoff: cutoff.toISOString(),
      });
    }

    return {
      dryRun,
      cutoffIso: cutoff.toISOString(),
      conversationCount,
      deleted,
      ranAt: new Date().toISOString(),
    };
  }
}
