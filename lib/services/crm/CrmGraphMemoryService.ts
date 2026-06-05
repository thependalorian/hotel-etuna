/**
 * CRM graph memory — Postgres-backed edges + guest facts for hospitality CRM
 *
 * Purpose: Relationship graph (guest ↔ property, booking, outreach) and fact lines for Sofia prompts.
 * Location: lib/services/crm/CrmGraphMemoryService.ts
 */

import { and, desc, eq, or } from 'drizzle-orm';
import { db, crmGraphEdges, crmGuestMemoryFacts } from '@/lib/db';
import { mem0ListMemoriesForUser, mem0UserId, isMem0Configured } from '@/lib/integrations/mem0';
import { factsAreSimilar } from '@/lib/services/crm/SofiaGuestFactExtractor';
import { securityLogger } from '@/lib/utils/security-logger';

const MAX_FACTS = 15;
const MAX_EDGES = 20;

export class CrmGraphMemoryService {
  async ensureEdge(params: {
    tenantId: string;
    srcType: string;
    srcId: string;
    dstType: string;
    dstId: string;
    relationType: string;
    metadata?: Record<string, unknown>;
  }): Promise<void> {
    try {
      await db
        .insert(crmGraphEdges)
        .values({
          tenantId: params.tenantId,
          srcEntityType: params.srcType,
          srcEntityId: params.srcId,
          dstEntityType: params.dstType,
          dstEntityId: params.dstId,
          relationType: params.relationType,
          metadata: params.metadata ?? {},
        })
        .onConflictDoNothing({
          target: [
            crmGraphEdges.tenantId,
            crmGraphEdges.srcEntityType,
            crmGraphEdges.srcEntityId,
            crmGraphEdges.dstEntityType,
            crmGraphEdges.dstEntityId,
            crmGraphEdges.relationType,
          ],
        });
    } catch (e) {
      securityLogger.error('[CrmGraphMemoryService] ensureEdge', e);
    }
  }

  async hasSimilarFact(tenantId: string, guestId: string, factText: string): Promise<boolean> {
    const existing = await this.listFactsForGuest(tenantId, guestId, MAX_FACTS);
    return existing.some((f) => factsAreSimilar(f.factText, factText));
  }

  async addGuestFactIfNew(params: {
    tenantId: string;
    guestId: string;
    factText: string;
    source?: string;
    sessionId?: string;
    mem0MemoryId?: string;
  }): Promise<string | null> {
    if (await this.hasSimilarFact(params.tenantId, params.guestId, params.factText)) {
      return null;
    }
    return this.addGuestFact(params);
  }

  async addGuestFact(params: {
    tenantId: string;
    guestId: string;
    factText: string;
    source?: string;
    sessionId?: string;
    mem0MemoryId?: string;
  }): Promise<string | null> {
    try {
      const [row] = await db
        .insert(crmGuestMemoryFacts)
        .values({
          tenantId: params.tenantId,
          guestId: params.guestId,
          factText: params.factText,
          source: params.source ?? 'staff',
          conversationSessionId: params.sessionId,
          mem0MemoryId: params.mem0MemoryId,
        })
        .returning({ id: crmGuestMemoryFacts.id });
      return row?.id ?? null;
    } catch (e) {
      securityLogger.error('[CrmGraphMemoryService] addGuestFact', e);
      return null;
    }
  }

  async listFactsForGuest(tenantId: string, guestId: string, limit = MAX_FACTS) {
    return db
      .select()
      .from(crmGuestMemoryFacts)
      .where(and(eq(crmGuestMemoryFacts.tenantId, tenantId), eq(crmGuestMemoryFacts.guestId, guestId)))
      .orderBy(desc(crmGuestMemoryFacts.createdAt))
      .limit(limit);
  }

  async listEdgesForGuest(tenantId: string, guestId: string, limit = MAX_EDGES) {
    return db
      .select()
      .from(crmGraphEdges)
      .where(
        and(
          eq(crmGraphEdges.tenantId, tenantId),
          or(
            and(eq(crmGraphEdges.srcEntityType, 'guest'), eq(crmGraphEdges.srcEntityId, guestId)),
            and(eq(crmGraphEdges.dstEntityType, 'guest'), eq(crmGraphEdges.dstEntityId, guestId))
          )
        )
      )
      .orderBy(desc(crmGraphEdges.createdAt))
      .limit(limit);
  }

  /** Compact block appended to Sofia system context */
  async buildPromptAugmentation(
    tenantId: string,
    guestId: string | undefined,
    currentUserMessage: string
  ): Promise<string> {
    if (!guestId) return '';

    const parts: string[] = ['CRM graph & long-term memory (use only if relevant):\n'];

    const facts = await db
      .select({ factText: crmGuestMemoryFacts.factText, source: crmGuestMemoryFacts.source })
      .from(crmGuestMemoryFacts)
      .where(and(eq(crmGuestMemoryFacts.tenantId, tenantId), eq(crmGuestMemoryFacts.guestId, guestId)))
      .orderBy(desc(crmGuestMemoryFacts.createdAt))
      .limit(MAX_FACTS * 2);

    const queryTokens = new Set(
      currentUserMessage
        .toLowerCase()
        .split(/\W+/)
        .filter((w) => w.length > 3)
    );

    const rankedFacts = [...facts].sort((a, b) => {
      const score = (text: string) => {
        const words = text.toLowerCase().split(/\W+/).filter((w) => w.length > 3);
        if (!queryTokens.size) return 0;
        return words.filter((w) => queryTokens.has(w)).length;
      };
      return score(b.factText) - score(a.factText);
    });

    const topFacts = rankedFacts.slice(0, MAX_FACTS);

    if (topFacts.length) {
      parts.push('Recorded facts:\n');
      for (const f of topFacts) {
        parts.push(`- (${f.source}) ${f.factText}\n`);
      }
    }

    const edges = await db
      .select()
      .from(crmGraphEdges)
      .where(
        and(
          eq(crmGraphEdges.tenantId, tenantId),
          or(
            and(eq(crmGraphEdges.srcEntityType, 'guest'), eq(crmGraphEdges.srcEntityId, guestId)),
            and(eq(crmGraphEdges.dstEntityType, 'guest'), eq(crmGraphEdges.dstEntityId, guestId))
          )
        )
      )
      .orderBy(desc(crmGraphEdges.createdAt))
      .limit(MAX_EDGES);

    if (edges.length) {
      parts.push('Relationships:\n');
      for (const e of edges) {
        parts.push(
          `- ${e.srcEntityType}:${e.srcEntityId} —[${e.relationType}]→ ${e.dstEntityType}:${e.dstEntityId}\n`
        );
      }
    }

    if (isMem0Configured()) {
      const mid = mem0UserId(tenantId, guestId);
      const memLines = await mem0ListMemoriesForUser(mid, 10);
      if (memLines.length) {
        parts.push('Mem0 summaries:\n');
        for (const m of memLines) {
          parts.push(`- ${m}\n`);
        }
      }
    }

    if (parts.length === 1) return '';
    return parts.join('');
  }
}
