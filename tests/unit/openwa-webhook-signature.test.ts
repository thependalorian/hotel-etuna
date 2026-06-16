import { createHmac } from 'crypto';
import { describe, expect, it } from 'vitest';
import { verifyOpenWaWebhookSignature } from '@/lib/integrations/whatsapp/openwa-webhook-signature';

describe('openwa-webhook-signature', () => {
  const secret = 'test-webhook-secret';
  const payload = {
    event: 'message.received',
    sessionId: 'hoteletuna-flagship',
    data: { from: '264818024833@c.us', body: 'Hello' },
  };

  function sign(body: unknown): string {
    return (
      'sha256=' +
      createHmac('sha256', secret).update(JSON.stringify(body)).digest('hex')
    );
  }

  it('accepts valid HMAC', () => {
    const sig = sign(payload);
    expect(verifyOpenWaWebhookSignature(payload, sig, secret)).toBe(true);
  });

  it('rejects invalid HMAC', () => {
    expect(verifyOpenWaWebhookSignature(payload, 'sha256=deadbeef', secret)).toBe(false);
  });

  it('rejects missing signature', () => {
    expect(verifyOpenWaWebhookSignature(payload, null, secret)).toBe(false);
  });
});
