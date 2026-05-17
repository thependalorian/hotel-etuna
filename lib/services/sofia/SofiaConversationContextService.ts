/**
 * Load/merge structured flow state on ai_conversations.context (JSONB).
 * Location: lib/services/sofia/SofiaConversationContextService.ts
 */

import { and, eq } from 'drizzle-orm';
import { db, aiConversations } from '@/lib/db';
import type { SofiaConversationContextJson } from '@/lib/types/sofia-conversation-context';

export class SofiaConversationContextService {
  async getContext(tenantId: string, sessionId: string): Promise<SofiaConversationContextJson> {
    const [row] = await db
      .select({ context: aiConversations.context })
      .from(aiConversations)
      .where(and(eq(aiConversations.tenantId, tenantId), eq(aiConversations.sessionId, sessionId)))
      .limit(1);

    const raw = row?.context;
    if (raw && typeof raw === 'object' && !Array.isArray(raw)) {
      return raw as SofiaConversationContextJson;
    }
    return {};
  }

  async mergeContext(
    tenantId: string,
    sessionId: string,
    patch: SofiaConversationContextJson
  ): Promise<SofiaConversationContextJson> {
    const current = await this.getContext(tenantId, sessionId);
    const next: SofiaConversationContextJson = {
      ...current,
      ...patch,
      restaurantReservation: patch.restaurantReservation
        ? { ...current.restaurantReservation, ...patch.restaurantReservation }
        : current.restaurantReservation,
    };

    await db
      .update(aiConversations)
      .set({ context: next, updatedAt: new Date() })
      .where(and(eq(aiConversations.tenantId, tenantId), eq(aiConversations.sessionId, sessionId)));

    return next;
  }
}
