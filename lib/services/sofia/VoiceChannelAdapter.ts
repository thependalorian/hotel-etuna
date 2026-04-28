/**
 * VoiceChannelAdapter
 *
 * Purpose: Normalize telephony webhooks into Sofia `PHONE` channel turns; persist `sofia_voice_sessions`
 * and link to `ai_conversations` / `ai_messages` via `SofiaConciergeService`.
 * Location: /lib/services/sofia/VoiceChannelAdapter.ts
 */

import { db } from '@/lib/db';
import { aiConversations, sofiaVoiceSessions } from '@/lib/db/schema';
import { and, eq } from 'drizzle-orm';
import { SofiaConciergeService } from '@/lib/services/ai/SofiaConciergeService';
import type { UserRole } from '@/lib/services/ai/DataFilterService';

export type VoiceWebhookEventType =
  | 'session.started'
  | 'transcript.user'
  | 'session.ended'
  | 'handoff.requested';

export type VoiceWebhookPayload = {
  type: VoiceWebhookEventType;
  tenantId: string;
  propertyId?: string | null;
  /** Provider-unique call id (idempotency key with tenant). */
  externalCallId: string;
  /** Known guest id from IVR/CRM lookup when the caller is identified. */
  guestId?: string | null;
  provider?: string;
  /** Final or interim user utterance (STT). */
  text?: string;
  role?: UserRole;
  metadata?: Record<string, unknown>;
};

export type VoiceWebhookResult =
  | { ok: true; sessionId: string; speak?: string; handoff?: boolean; intent?: string }
  | { ok: false; error: string; status?: number };

export class VoiceChannelAdapter {
  private concierge = new SofiaConciergeService();

  static voiceSessionId(tenantId: string, externalCallId: string): string {
    return `voice:${tenantId}:${externalCallId}`;
  }

  async handleEvent(payload: VoiceWebhookPayload): Promise<VoiceWebhookResult> {
    const provider = payload.provider ?? 'generic';
    const sessionId = VoiceChannelAdapter.voiceSessionId(payload.tenantId, payload.externalCallId);

    try {
      if (payload.type === 'session.started') {
        const [existingStart] = await db
          .select({ id: sofiaVoiceSessions.id })
          .from(sofiaVoiceSessions)
          .where(
            and(
              eq(sofiaVoiceSessions.tenantId, payload.tenantId),
              eq(sofiaVoiceSessions.externalCallId, payload.externalCallId)
            )
          )
          .limit(1);

        if (!existingStart) {
          await db.insert(sofiaVoiceSessions).values({
            tenantId: payload.tenantId,
            propertyId: payload.propertyId ?? null,
            externalCallId: payload.externalCallId,
            provider,
            status: 'active',
            metadata: {
              ...(payload.metadata ?? {}),
              sofiaSessionId: sessionId,
              guestId: payload.guestId ?? null,
            },
          });
        }

        return {
          ok: true,
          sessionId,
          speak:
            "Hello, this is Sofia from Buffr Host. How may I help you today?",
        };
      }

      if (payload.type === 'session.ended') {
        await db
          .update(sofiaVoiceSessions)
          .set({
            status: 'completed',
            endedAt: new Date(),
            updatedAt: new Date(),
            metadata: payload.metadata ?? undefined,
          })
          .where(
            and(
              eq(sofiaVoiceSessions.tenantId, payload.tenantId),
              eq(sofiaVoiceSessions.externalCallId, payload.externalCallId)
            )
          );
        return { ok: true, sessionId };
      }

      if (payload.type === 'handoff.requested') {
        await db
          .update(sofiaVoiceSessions)
          .set({
            handoffRequested: true,
            status: 'escalated',
            updatedAt: new Date(),
          })
          .where(
            and(
              eq(sofiaVoiceSessions.tenantId, payload.tenantId),
              eq(sofiaVoiceSessions.externalCallId, payload.externalCallId)
            )
          );

        const [conv] = await db
          .select({ id: aiConversations.id })
          .from(aiConversations)
          .where(
            and(
              eq(aiConversations.tenantId, payload.tenantId),
              eq(aiConversations.sessionId, sessionId)
            )
          )
          .limit(1);

        if (conv) {
          await db
            .update(aiConversations)
            .set({ status: 'escalated', updatedAt: new Date() })
            .where(eq(aiConversations.id, conv.id));
        }

        await db
          .update(sofiaVoiceSessions)
          .set({
            conversationId: conv?.id ?? null,
            updatedAt: new Date(),
          })
          .where(
            and(
              eq(sofiaVoiceSessions.tenantId, payload.tenantId),
              eq(sofiaVoiceSessions.externalCallId, payload.externalCallId)
            )
          );

        return {
          ok: true,
          sessionId,
          handoff: true,
          speak: 'Connecting you with a team member now. Please hold.',
        };
      }

      if (payload.type !== 'transcript.user') {
        return { ok: false, error: 'Unsupported event type', status: 400 };
      }

      const text = (payload.text ?? '').trim();
      if (!text) {
        return { ok: false, error: 'Missing text for transcript', status: 400 };
      }

      const ai = await this.concierge.processMessage(
        {
          message: text,
          context: {
            tenantId: payload.tenantId,
            propertyId: payload.propertyId ?? undefined,
            guestId: payload.guestId ?? undefined,
            sessionId,
          },
          channel: 'PHONE',
        },
        payload.role ?? 'guest'
      );

      const [conv] = await db
        .select({ id: aiConversations.id })
        .from(aiConversations)
        .where(
          and(
            eq(aiConversations.tenantId, payload.tenantId),
            eq(aiConversations.sessionId, sessionId)
          )
        )
        .limit(1);

      if (conv) {
        await db
          .update(sofiaVoiceSessions)
          .set({
            conversationId: conv.id,
            updatedAt: new Date(),
          })
          .where(
            and(
              eq(sofiaVoiceSessions.tenantId, payload.tenantId),
              eq(sofiaVoiceSessions.externalCallId, payload.externalCallId)
            )
          );
      }

      return {
        ok: true,
        sessionId,
        speak: ai.response,
        handoff: false,
        intent: ai.intent,
      };
    } catch (e) {
      console.error('[VoiceChannelAdapter]', e);
      return {
        ok: false,
        error: e instanceof Error ? e.message : 'Voice handler error',
        status: 500,
      };
    }
  }
}
