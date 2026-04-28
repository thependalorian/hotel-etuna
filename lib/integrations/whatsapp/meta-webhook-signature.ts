/**
 * Meta / WhatsApp webhook HMAC verification (X-Hub-Signature-256).
 *
 * Purpose: Validate POST bodies from Meta before parsing JSON.
 * Location: /lib/integrations/whatsapp/meta-webhook-signature.ts
 *
 * @see https://developers.facebook.com/docs/graph-api/webhooks/getting-started#verify-requests
 */

import { createHmac, timingSafeEqual } from 'crypto';

export function verifyMetaWebhookSignature(
  rawBody: string,
  signatureHeader: string | null,
  appSecret: string
): boolean {
  if (!signatureHeader || !signatureHeader.startsWith('sha256=')) {
    return false;
  }
  const expected =
    'sha256=' + createHmac('sha256', appSecret).update(rawBody, 'utf8').digest('hex');
  try {
    const a = Buffer.from(signatureHeader, 'utf8');
    const b = Buffer.from(expected, 'utf8');
    if (a.length !== b.length) return false;
    return timingSafeEqual(a, b);
  } catch {
    return false;
  }
}
