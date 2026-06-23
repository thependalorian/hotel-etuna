/**
 * Shared inbound WhatsApp → Sofia pipeline (Meta Cloud API).
 * Location: lib/services/whatsapp/processWhatsappInboundForSofia.ts
 */

import { processSofiaConciergeMessage } from '@/lib/services/ai/sofia-concierge-handler';
import { db } from '@/lib/db';
import { aiConversations } from '@/lib/db/schema';
import { findGuestIdByWhatsappPhone } from '@/lib/services/whatsapp/findGuestByWhatsappPhone';
import { notifyWhatsappEscalationToHubTeam } from '@/lib/services/whatsapp/whatsapp-escalation-notify';
import { securityLogger } from '@/lib/utils/security-logger';
import type { WhatsappProvider } from '@/lib/services/whatsapp/tenantWhatsappLookup';
import { and, eq } from 'drizzle-orm';

export type ProcessWhatsappInboundInput = {
  tenantId: string;
  defaultPropertyId?: string | null;
  guestPhone: string;
  text: string;
  provider: WhatsappProvider;
};

export type ProcessWhatsappInboundResult = {
  responseText: string;
  sessionId: string;
  escalated: boolean;
};

export async function processWhatsappInboundForSofia(
  input: ProcessWhatsappInboundInput
): Promise<ProcessWhatsappInboundResult> {
  const waFrom = input.guestPhone.replace(/\D/g, '');
  const sessionId = `wa:${input.tenantId}:${waFrom}`;
  const guestId = await findGuestIdByWhatsappPhone(input.tenantId, waFrom);

  const aiResponse = await processSofiaConciergeMessage(
    {
      message: input.text,
      sessionId,
      tenantId: input.tenantId,
      propertyId: input.defaultPropertyId ?? undefined,
      guestId,
      language: 'en',
      channel: 'WHATSAPP',
    },
    'guest'
  );

  const escalated = aiResponse.intent === 'human_escalation_required';

  try {
    const [conv] = await db
      .select({ id: aiConversations.id, context: aiConversations.context })
      .from(aiConversations)
      .where(
        and(
          eq(aiConversations.sessionId, sessionId),
          eq(aiConversations.tenantId, input.tenantId)
        )
      )
      .limit(1);

    if (conv) {
      const ctx =
        conv.context && typeof conv.context === 'object'
          ? { ...(conv.context as Record<string, unknown>) }
          : {};
      ctx.whatsappProvider = input.provider;
      await db
        .update(aiConversations)
        .set({ context: ctx, updatedAt: new Date() })
        .where(eq(aiConversations.id, conv.id));
    }
  } catch (err) {
    securityLogger.warn('[whatsapp] failed to tag provider on conversation', err);
  }

  if (escalated) {
    try {
      await notifyWhatsappEscalationToHubTeam({
        tenantId: input.tenantId,
        sessionId,
        guestPhone: waFrom,
        provider: input.provider,
        lastGuestMessage: input.text,
      });
    } catch (err) {
      securityLogger.error('[whatsapp] escalation notify failed', err);
    }
  }

  return {
    responseText: aiResponse.response,
    sessionId,
    escalated,
  };
}
