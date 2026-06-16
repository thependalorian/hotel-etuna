/**
 * Outbound WhatsApp send — resolves Meta vs OpenWA per tenant and dispatches.
 * Location: lib/services/whatsapp/sendWhatsappOutbound.ts
 */

import { sendOpenWaTextMessage } from '@/lib/integrations/whatsapp/openwa-client';
import { sendWhatsAppTextMessage } from '@/lib/integrations/whatsapp/whatsapp-graph-api';
import {
  getActiveWhatsappProviderForTenant,
  resolveOpenWaApiBaseUrl,
  resolveOpenWaApiKey,
  type WhatsappProvider,
} from '@/lib/services/whatsapp/tenantWhatsappLookup';

export type SendWhatsappOutboundParams = {
  tenantId: string;
  toPhone: string;
  text: string;
  preferredProvider?: WhatsappProvider;
};

export type SendWhatsappOutboundResult =
  | { ok: true; provider: WhatsappProvider }
  | { ok: false; provider?: WhatsappProvider; status?: number; body?: string; error: string };

export async function sendWhatsappOutbound(
  params: SendWhatsappOutboundParams
): Promise<SendWhatsappOutboundResult> {
  const routing = await getActiveWhatsappProviderForTenant(
    params.tenantId,
    params.preferredProvider
  );

  if (!routing) {
    return { ok: false, error: 'No active WhatsApp provider configured for tenant' };
  }

  if (routing.provider === 'openwa') {
    const apiBaseUrl = resolveOpenWaApiBaseUrl(routing);
    const apiKey = resolveOpenWaApiKey();
    const sessionId = routing.openwaSessionId;

    if (!apiBaseUrl || !apiKey || !sessionId) {
      return { ok: false, provider: 'openwa', error: 'OpenWA not configured' };
    }

    const result = await sendOpenWaTextMessage({
      to: params.toPhone,
      text: params.text,
      sessionId,
      apiBaseUrl,
      apiKey,
    });

    if (!result.ok) {
      return {
        ok: false,
        provider: 'openwa',
        status: result.status,
        body: result.body,
        error: 'OpenWA send failed',
      };
    }

    return { ok: true, provider: 'openwa' };
  }

  const phoneNumberId = routing.phoneNumberId;
  const accessToken =
    (routing.accessToken && routing.accessToken.trim()) ||
    process.env.WHATSAPP_ACCESS_TOKEN ||
    '';

  if (!phoneNumberId || !accessToken) {
    return { ok: false, provider: 'meta', error: 'Meta WhatsApp not configured' };
  }

  const result = await sendWhatsAppTextMessage({
    to: params.toPhone,
    text: params.text,
    phoneNumberId,
    accessToken,
  });

  if (!result.ok) {
    return {
      ok: false,
      provider: 'meta',
      status: result.status,
      body: result.body,
      error: 'Meta send failed',
    };
  }

  return { ok: true, provider: 'meta' };
}
