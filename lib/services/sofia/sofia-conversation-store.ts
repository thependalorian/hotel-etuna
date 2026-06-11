/**
 * Sofia AI conversation persistence — ai_conversations / ai_messages / guest linkage.
 * Location: lib/services/sofia/sofia-conversation-store.ts
 */

import { db } from '@/lib/db';
import {
  aiConversations,
  aiMessages,
  guests,
  type Guest,
} from '@/lib/db/schema';
import { and, asc, desc, eq, gte, inArray } from 'drizzle-orm';
import type { AIConversationChannel, AIResponse } from '@/lib/types/ai';
import type { ConversationContext } from '@/lib/types/ai';
import { handleServiceError } from '@/lib/utils/errors';
import { securityLogger } from '@/lib/utils/security-logger';
import { extractEmail } from '@/lib/services/sofia/sofia-intent';

export type SofiaConversationTurn = {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
};

export class SofiaConversationStore {
  async getConversationHistory(
    sessionId: string,
    tenantId: string,
  ): Promise<SofiaConversationTurn[]> {
    try {
      const [conv] = await db
        .select({ id: aiConversations.id })
        .from(aiConversations)
        .where(and(eq(aiConversations.sessionId, sessionId), eq(aiConversations.tenantId, tenantId)))
        .limit(1);
      if (!conv) return [];

      const messages = await db
        .select({
          senderType: aiMessages.senderType,
          content: aiMessages.content,
          createdAt: aiMessages.createdAt,
        })
        .from(aiMessages)
        .where(eq(aiMessages.conversationId, conv.id))
        .orderBy(asc(aiMessages.createdAt))
        .limit(20);

      return messages.map((msg) => ({
        role: (msg.senderType === 'ASSISTANT' ? 'assistant' : 'user') as 'user' | 'assistant',
        content: msg.content,
        timestamp: msg.createdAt ?? new Date(),
      }));
    } catch (error) {
      handleServiceError(error, 'Error fetching conversation history');
      return [];
    }
  }

  async getEmailFromConversation(sessionId: string, tenantId: string): Promise<string | null> {
    try {
      const [conv] = await db
        .select({ id: aiConversations.id, guestId: aiConversations.guestId })
        .from(aiConversations)
        .where(and(eq(aiConversations.sessionId, sessionId), eq(aiConversations.tenantId, tenantId)))
        .limit(1);

      if (conv?.guestId) {
        const [g] = await db
          .select({ email: guests.email })
          .from(guests)
          .where(eq(guests.id, conv.guestId))
          .limit(1);
        if (g?.email) return g.email;
      }

      if (!conv) return null;

      const messages = await db
        .select({ metadata: aiMessages.metadata })
        .from(aiMessages)
        .where(eq(aiMessages.conversationId, conv.id))
        .orderBy(desc(aiMessages.createdAt))
        .limit(10);

      for (const message of messages) {
        const meta = message.metadata as Record<string, unknown> | null;
        if (meta && typeof meta === 'object' && 'guest_email' in meta) {
          return meta.guest_email as string;
        }
      }
      return null;
    } catch (error) {
      securityLogger.error('Error getting email from conversation:', error);
      return null;
    }
  }

  async findOrCreateGuest(tenantId: string, email: string): Promise<Guest | null> {
    try {
      const [existing] = await db
        .select()
        .from(guests)
        .where(and(eq(guests.tenantId, tenantId), eq(guests.email, email)))
        .limit(1);
      if (existing) return existing;

      const [guest] = await db
        .insert(guests)
        .values({
          tenantId,
          email,
          isSignedUp: false,
        })
        .onConflictDoUpdate({
          target: guests.email,
          set: { updatedAt: new Date() },
        })
        .returning();

      if (guest) return guest;

      const [fallback] = await db.select().from(guests).where(eq(guests.email, email)).limit(1);
      return fallback ?? null;
    } catch (error) {
      securityLogger.error('Error finding or creating guest:', error);
      try {
        const [byEmail] = await db.select().from(guests).where(eq(guests.email, email)).limit(1);
        return byEmail ?? null;
      } catch {
        return null;
      }
    }
  }

  async saveConversation(
    context: ConversationContext,
    userMessage: string,
    aiResponse: AIResponse,
    guestEmail?: string | null,
    channel: AIConversationChannel = 'WEB',
  ): Promise<void> {
    try {
      let [conversation] = await db
        .select()
        .from(aiConversations)
        .where(
          and(
            eq(aiConversations.sessionId, context.sessionId),
            eq(aiConversations.tenantId, context.tenantId),
          ),
        )
        .limit(1);

      if (!conversation) {
        const [created] = await db
          .insert(aiConversations)
          .values({
            sessionId: context.sessionId,
            tenantId: context.tenantId,
            guestId: context.guestId ?? null,
            propertyId: context.propertyId ?? null,
            channel,
            status: 'active',
          })
          .returning();
        conversation = created!;
      }

      const emailFromMessage = guestEmail ?? extractEmail(userMessage);
      const userMeta: Record<string, unknown> = {
        property_id: context.propertyId,
        booking_id: context.bookingId,
        ...(emailFromMessage && { guest_email: emailFromMessage }),
      };
      const assistantMeta: Record<string, unknown> = {
        confidence: aiResponse.confidence,
        intent: aiResponse.intent,
        entities: aiResponse.entities,
        property_id: context.propertyId,
        booking_id: context.bookingId,
        ...(emailFromMessage && { guest_email: emailFromMessage }),
        ...(aiResponse.rag ? { rag: aiResponse.rag } : {}),
        ...(aiResponse.entities &&
        typeof aiResponse.entities === 'object' &&
        'tokenUsage' in aiResponse.entities
          ? { token_usage: (aiResponse.entities as { tokenUsage?: unknown }).tokenUsage }
          : {}),
      };

      await db.insert(aiMessages).values({
        conversationId: conversation.id,
        senderType: 'USER',
        content: userMessage,
        metadata: userMeta,
      });
      await db.insert(aiMessages).values({
        conversationId: conversation.id,
        senderType: 'ASSISTANT',
        content: aiResponse.response,
        metadata: assistantMeta,
      });
    } catch (error) {
      securityLogger.error('Error saving conversation:', error);
    }
  }

  async markConversationEscalated(sessionId: string, tenantId: string): Promise<void> {
    await db
      .update(aiConversations)
      .set({ status: 'escalated', updatedAt: new Date() })
      .where(
        and(eq(aiConversations.sessionId, sessionId), eq(aiConversations.tenantId, tenantId)),
      );
  }

  async getConversationStats(tenantId: string, propertyId?: string) {
    try {
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const convConditions = [
        eq(aiConversations.tenantId, tenantId),
        ...(propertyId ? [eq(aiConversations.propertyId, propertyId)] : []),
      ];
      const convs = await db
        .select({ id: aiConversations.id })
        .from(aiConversations)
        .where(and(...convConditions, gte(aiConversations.createdAt, thirtyDaysAgo)));
      const convIds = convs.map((c) => c.id);
      if (convIds.length === 0) {
        return { totalConversations: 0, avgConfidence: 0, dailyStats: [] as never[] };
      }

      const assistantMessages = await db
        .select({ metadata: aiMessages.metadata })
        .from(aiMessages)
        .where(and(eq(aiMessages.senderType, 'ASSISTANT'), inArray(aiMessages.conversationId, convIds)));

      let totalConfidence = 0;
      let confidenceCount = 0;
      assistantMessages.forEach((msg) => {
        const meta = msg.metadata as Record<string, unknown> | null;
        if (meta && typeof meta.confidence === 'number') {
          totalConfidence += meta.confidence;
          confidenceCount++;
        }
      });

      const avgConfidence = confidenceCount > 0 ? totalConfidence / confidenceCount : 0;

      return {
        totalConversations: convIds.length,
        avgConfidence,
        dailyStats: [],
      };
    } catch (error) {
      handleServiceError(error, 'Error fetching conversation stats');
    }
  }
}
