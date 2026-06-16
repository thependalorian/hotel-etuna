/**
 * OpenWA REST client — outbound text messages via Railway sidecar.
 * Location: lib/integrations/whatsapp/openwa-client.ts
 */

import { toOpenWaChatId } from '@/lib/integrations/whatsapp/openwa-phone';

const MAX_TEXT_LENGTH = 4096;

export type SendOpenWaTextParams = {
  to: string;
  text: string;
  sessionId: string;
  apiBaseUrl: string;
  apiKey: string;
};

export type SendOpenWaTextResult =
  | { ok: true; status: number }
  | { ok: false; status: number; body: string };

function resolveBaseUrl(baseUrl: string): string {
  return baseUrl.replace(/\/$/, '');
}

/**
 * Sends a text message via OpenWA session API.
 */
export async function sendOpenWaTextMessage(
  params: SendOpenWaTextParams
): Promise<SendOpenWaTextResult> {
  const body =
    params.text.length > MAX_TEXT_LENGTH
      ? params.text.slice(0, MAX_TEXT_LENGTH - 1) + '…'
      : params.text;

  const chatId = toOpenWaChatId(params.to);
  const url = `${resolveBaseUrl(params.apiBaseUrl)}/api/sessions/${encodeURIComponent(params.sessionId)}/messages/send-text`;

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'X-API-Key': params.apiKey,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ chatId, text: body }),
  });

  if (!res.ok) {
    const errText = await res.text();
    return { ok: false, status: res.status, body: errText.slice(0, 2000) };
  }

  return { ok: true, status: res.status };
}
