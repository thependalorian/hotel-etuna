/**
 * ConversationService
 *
 * Purpose: Tenant-scoped helpers for Sofia AI conversation rows (`ai_conversations`, `ai_messages`).
 * Location: /lib/services/sofia/ConversationService.ts
 *
 * Used by voice and future channels to link sessions without duplicating concierge internals.
 */

import { db } from '@/lib/db';
import { aiConversations, aiMessages } from '@/lib/db/schema';
import { and, eq, asc } from 'drizzle-orm';
import type { AIConversationChannel } from '@/lib/types/ai';

export class ConversationService {
  async getBySession(tenantId: string, sessionId: string) {
    const [row] = await db
      .select()
      .from(aiConversations)
      .where(and(eq(aiConversations.tenantId, tenantId), eq(aiConversations.sessionId, sessionId)))
      .limit(1);
    return row ?? null;
  }

  async ensureConversation(params: {
    tenantId: string;
    sessionId: string;
    channel: AIConversationChannel;
    propertyId?: string | null;
    guestId?: string | null;
  }) {
    const existing = await this.getBySession(params.tenantId, params.sessionId);
    if (existing) return existing;

    const [created] = await db
      .insert(aiConversations)
      .values({
        tenantId: params.tenantId,
        sessionId: params.sessionId,
        channel: params.channel,
        propertyId: params.propertyId ?? null,
        guestId: params.guestId ?? null,
        status: 'active',
      })
      .returning();
    return created!;
  }

  async listMessages(conversationId: string, limit = 50) {
    return db
      .select({
        senderType: aiMessages.senderType,
        content: aiMessages.content,
        createdAt: aiMessages.createdAt,
        metadata: aiMessages.metadata,
      })
      .from(aiMessages)
      .where(eq(aiMessages.conversationId, conversationId))
      .orderBy(asc(aiMessages.createdAt))
      .limit(limit);
  }
}
