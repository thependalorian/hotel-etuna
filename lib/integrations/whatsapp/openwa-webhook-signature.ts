/**
 * OpenWA webhook HMAC verification (sha256 over JSON payload).
 * Location: lib/integrations/whatsapp/openwa-webhook-signature.ts
 *
 * Spec: https://github.com/rmyndharis/OpenWA/blob/main/docs/06-api-specification.md §6.5
 */

import { createHmac, timingSafeEqual } from 'crypto';

export function verifyOpenWaWebhookSignature(
  payload: unknown,
  signatureHeader: string | null,
  secret: string
): boolean {
  if (!signatureHeader?.trim() || !secret.trim()) {
    return false;
  }

  const expected =
    'sha256=' +
    createHmac('sha256', secret).update(JSON.stringify(payload)).digest('hex');

  try {
    const sigBuf = Buffer.from(signatureHeader);
    const expBuf = Buffer.from(expected);
    if (sigBuf.length !== expBuf.length) {
      return false;
    }
    return timingSafeEqual(sigBuf, expBuf);
  } catch {
    return false;
  }
}
