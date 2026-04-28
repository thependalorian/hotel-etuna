/**
 * WhatsApp Cloud API client (text outbound, Graph API v21.0).
 *
 * Purpose: Send reply messages after Sofia processes inbound webhook text.
 * Location: /lib/integrations/whatsapp/whatsapp-graph-api.ts
 */

export const WHATSAPP_GRAPH_API_VERSION = 'v21.0';

const MAX_TEXT_LENGTH = 4096;

export type SendWhatsAppTextParams = {
  /** E.164 without + per Cloud API (digits only is typical for `to`) */
  to: string;
  text: string;
  phoneNumberId: string;
  accessToken: string;
};

export type SendWhatsAppTextResult =
  | { ok: true; status: number }
  | { ok: false; status: number; body: string };

/**
 * Sends a text message via WhatsApp Cloud API.
 * Response: { ok } only; logs should happen at caller for failures.
 */
export async function sendWhatsAppTextMessage(
  params: SendWhatsAppTextParams
): Promise<SendWhatsAppTextResult> {
  const body = params.text.length > MAX_TEXT_LENGTH
    ? params.text.slice(0, MAX_TEXT_LENGTH - 1) + '…'
    : params.text;

  const url = `https://graph.facebook.com/${WHATSAPP_GRAPH_API_VERSION}/${params.phoneNumberId}/messages`;
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${params.accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      messaging_product: 'whatsapp',
      to: params.to,
      type: 'text',
      text: { body: body },
    }),
  });

  if (!res.ok) {
    const errText = await res.text();
    return { ok: false, status: res.status, body: errText.slice(0, 2000) };
  }

  return { ok: true, status: res.status };
}
