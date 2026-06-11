/**
 * CalWebhookService unit tests — HMAC verification and webhook handling.
 * Location: tests/unit/cal-webhook-service.test.ts
 */

import crypto from 'node:crypto';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const { mockInsert } = vi.hoisted(() => ({
  mockInsert: vi.fn(),
}));

vi.mock('@/lib/db', () => ({
  db: {
    insert: mockInsert,
  },
}));

import { CalWebhookService } from '@/lib/services/scheduling/CalWebhookService';

function signBody(raw: string, secret: string): string {
  return crypto.createHmac('sha256', secret).update(raw).digest('hex');
}

function insertChain() {
  return {
    values: vi.fn().mockReturnValue({
      onConflictDoUpdate: vi.fn().mockResolvedValue(undefined),
    }),
  };
}

describe('CalWebhookService.verifySignature', () => {
  const service = new CalWebhookService();

  beforeEach(() => {
    vi.unstubAllEnvs();
  });

  it('accepts a valid HMAC signature', () => {
    vi.stubEnv('CAL_WEBHOOK_SECRET', 'test-secret');
    const raw = JSON.stringify({ triggerEvent: 'BOOKING_CREATED', payload: { uid: 'abc' } });
    const sig = signBody(raw, 'test-secret');
    expect(service.verifySignature(raw, sig)).toBe(true);
  });

  it('rejects missing or invalid signatures', () => {
    vi.stubEnv('CAL_WEBHOOK_SECRET', 'test-secret');
    const raw = '{"triggerEvent":"BOOKING_CREATED"}';
    expect(service.verifySignature(raw, null)).toBe(false);
    expect(service.verifySignature(raw, 'bad-signature')).toBe(false);
  });
});

describe('CalWebhookService.handleWebhook', () => {
  const service = new CalWebhookService();

  beforeEach(() => {
    mockInsert.mockReset();
    mockInsert.mockReturnValue(insertChain());
  });

  it('upserts booking mirror for BOOKING_CREATED', async () => {
    const result = await service.handleWebhook('BOOKING_CREATED', {
      uid: 'cal-123',
      metadata: { propertyId: 'prop-1', bookingId: 'book-1' },
    });

    expect(result.ok).toBe(true);
    expect(result.calUid).toBe('cal-123');
    expect(mockInsert).toHaveBeenCalled();
  });

  it('ignores unsupported triggers', async () => {
    const result = await service.handleWebhook('MEETING_ENDED', { uid: 'x' });
    expect(result.ignored).toBe(true);
    expect(mockInsert).not.toHaveBeenCalled();
  });

  it('throws when uid is missing', async () => {
    await expect(service.handleWebhook('BOOKING_CREATED', {})).rejects.toThrow(
      'Cal.com payload missing uid/bookingId',
    );
  });
});
