/**
 * Outbound WhatsApp send — dispatches via the Meta Cloud API per tenant.
 * Location: lib/services/whatsapp/sendWhatsappOutbound.ts
 */

import { sendWhatsAppTextMessage } from '@/lib/integrations/whatsapp/whatsapp-graph-api';
import {
  getActiveWhatsappProviderForTenant,
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
