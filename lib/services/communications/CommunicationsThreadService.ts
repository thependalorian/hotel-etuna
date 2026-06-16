/**
 * Communications hub — list WhatsApp / Sofia guest threads for hub staff.
 * Location: lib/services/communications/CommunicationsThreadService.ts
 */

import { db } from '@/lib/db';
import { aiConversations, aiMessages } from '@/lib/db/schema';
import { and, desc, eq, ilike, or } from 'drizzle-orm';

export type CommunicationsThreadSummary = {
  sessionId: string;
  conversationId: string;
  channel: string;
  status: string | null;
  guestId: string | null;
  guestPhone: string | null;
  assignedInbox: string | null;
  whatsappProvider: string | null;
  lastMessage: string | null;
  lastMessageAt: string | null;
  updatedAt: string | null;
};

function parseSessionPhone(sessionId: string | null): string | null {
  if (!sessionId?.startsWith('wa:')) return null;
  const parts = sessionId.split(':');
  return parts.length >= 3 ? parts.slice(2).join(':') : null;
}

function readContextField(context: unknown, key: string): string | null {
  if (!context || typeof context !== 'object') return null;
  const val = (context as Record<string, unknown>)[key];
  return typeof val === 'string' ? val : null;
}

export class CommunicationsThreadService {
  async listThreads(
    tenantId: string,
    options?: { escalatedOnly?: boolean; limit?: number }
  ): Promise<CommunicationsThreadSummary[]> {
    const limit = Math.min(options?.limit ?? 50, 100);

    const conditions = [
      eq(aiConversations.tenantId, tenantId),
      or(
        eq(aiConversations.channel, 'WHATSAPP'),
        ilike(aiConversations.sessionId, 'wa:%')
      ),
    ];

    if (options?.escalatedOnly) {
      conditions.push(eq(aiConversations.status, 'escalated'));
    }

    const rows = await db
      .select({
        id: aiConversations.id,
        sessionId: aiConversations.sessionId,
        channel: aiConversations.channel,
        status: aiConversations.status,
        guestId: aiConversations.guestId,
        context: aiConversations.context,
        updatedAt: aiConversations.updatedAt,
      })
      .from(aiConversations)
      .where(and(...conditions))
      .orderBy(desc(aiConversations.updatedAt))
      .limit(limit);

    const summaries: CommunicationsThreadSummary[] = [];

    for (const row of rows) {
      const [last] = await db
        .select({
          content: aiMessages.content,
          createdAt: aiMessages.createdAt,
        })
        .from(aiMessages)
        .where(eq(aiMessages.conversationId, row.id))
        .orderBy(desc(aiMessages.createdAt))
        .limit(1);

      summaries.push({
        sessionId: row.sessionId ?? '',
        conversationId: row.id,
        channel: row.channel,
        status: row.status,
        guestId: row.guestId,
        guestPhone: parseSessionPhone(row.sessionId),
        assignedInbox: readContextField(row.context, 'assignedInbox'),
        whatsappProvider: readContextField(row.context, 'whatsappProvider'),
        lastMessage: last?.content ?? null,
        lastMessageAt: last?.createdAt?.toISOString() ?? null,
        updatedAt: row.updatedAt?.toISOString() ?? null,
      });
    }

    return summaries;
  }

  async getThreadMessages(tenantId: string, sessionId: string) {
    const [conv] = await db
      .select({
        id: aiConversations.id,
        sessionId: aiConversations.sessionId,
        channel: aiConversations.channel,
        status: aiConversations.status,
        context: aiConversations.context,
      })
      .from(aiConversations)
      .where(
        and(eq(aiConversations.tenantId, tenantId), eq(aiConversations.sessionId, sessionId))
      )
      .limit(1);

    if (!conv) return null;

    const messages = await db
      .select({
        id: aiMessages.id,
        senderType: aiMessages.senderType,
        content: aiMessages.content,
        metadata: aiMessages.metadata,
        createdAt: aiMessages.createdAt,
      })
      .from(aiMessages)
      .where(eq(aiMessages.conversationId, conv.id))
      .orderBy(aiMessages.createdAt);

    return {
      sessionId: conv.sessionId,
      conversationId: conv.id,
      channel: conv.channel,
      status: conv.status,
      guestPhone: parseSessionPhone(conv.sessionId),
      assignedInbox: readContextField(conv.context, 'assignedInbox'),
      whatsappProvider: readContextField(conv.context, 'whatsappProvider'),
      messages: messages.map((m) => ({
        id: m.id,
        senderType: m.senderType,
        content: m.content,
        createdAt: m.createdAt?.toISOString() ?? null,
      })),
    };
  }

  async assignThread(
    tenantId: string,
    sessionId: string,
    assignedInbox: 'frontdesk' | 'support'
  ): Promise<boolean> {
    const [conv] = await db
      .select({ id: aiConversations.id, context: aiConversations.context })
      .from(aiConversations)
      .where(
        and(eq(aiConversations.tenantId, tenantId), eq(aiConversations.sessionId, sessionId))
      )
      .limit(1);

    if (!conv) return false;

    const context =
      conv.context && typeof conv.context === 'object'
        ? { ...(conv.context as Record<string, unknown>) }
        : {};

    context.assignedInbox = assignedInbox;

    await db
      .update(aiConversations)
      .set({ context, updatedAt: new Date() })
      .where(eq(aiConversations.id, conv.id));

    return true;
  }

  async appendStaffReply(
    tenantId: string,
    sessionId: string,
    content: string,
    staffEmail: string
  ): Promise<boolean> {
    const [conv] = await db
      .select({ id: aiConversations.id })
      .from(aiConversations)
      .where(
        and(eq(aiConversations.tenantId, tenantId), eq(aiConversations.sessionId, sessionId))
      )
      .limit(1);

    if (!conv) return false;

    await db.insert(aiMessages).values({
      conversationId: conv.id,
      senderType: 'STAFF',
      content,
      metadata: { staffEmail },
    });

    await db
      .update(aiConversations)
      .set({ updatedAt: new Date() })
      .where(eq(aiConversations.id, conv.id));

    return true;
  }
}

export const communicationsThreadService = new CommunicationsThreadService();
