/**
 * Audit hash chain unit tests (pure functions, no DB).
 */

import { describe, expect, it } from 'vitest';
import {
  ZERO_HASH,
  canonicalJson,
  computeEventHash,
  verifyChainRecords,
} from '@/lib/compliance/AuditHashService';

const basePayload = {
  id: '11111111-1111-4111-8111-111111111111',
  timestamp: '2026-06-08T10:00:00.000Z',
  tenantId: '22222222-2222-4222-8222-222222222222',
  userId: '33333333-3333-4333-8333-333333333333',
  action: 'booking.updated',
  resourceType: 'booking',
  resourceId: '44444444-4444-4444-8444-444444444444',
  oldValues: { status: 'pending' },
  newValues: { status: 'confirmed' },
};

describe('audit hash chain', () => {
  it('canonicalJson sorts keys deterministically', () => {
    expect(canonicalJson({ b: 1, a: 2 })).toBe('{"a":2,"b":1}');
    expect(canonicalJson({ b: 1, a: 2 })).toBe(canonicalJson({ a: 2, b: 1 }));
  });

  it('computeEventHash chains to previous hash', () => {
    const first = computeEventHash(basePayload, ZERO_HASH);
    const second = computeEventHash(
      {
        ...basePayload,
        id: '55555555-5555-4555-8555-555555555555',
        action: 'booking.cancelled',
      },
      first
    );
    expect(first).toHaveLength(64);
    expect(second).toHaveLength(64);
    expect(first).not.toBe(second);
  });

  it('verifyChainRecords accepts a valid two-link chain', () => {
    const firstHash = computeEventHash(basePayload, ZERO_HASH);
    const secondPayload = {
      ...basePayload,
      id: '55555555-5555-4555-8555-555555555555',
      action: 'booking.cancelled',
    };
    const secondHash = computeEventHash(secondPayload, firstHash);

    const result = verifyChainRecords([
      {
        ...basePayload,
        previousHash: ZERO_HASH,
        eventHash: firstHash,
      },
      {
        ...secondPayload,
        previousHash: firstHash,
        eventHash: secondHash,
      },
    ]);

    expect(result.valid).toBe(true);
    expect(result.hashedEventsChecked).toBe(2);
    expect(result.tamperedEventId).toBeNull();
  });

  it('verifyChainRecords skips legacy rows without hashes', () => {
    const firstHash = computeEventHash(basePayload, ZERO_HASH);
    const result = verifyChainRecords([
      {
        ...basePayload,
        id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
        previousHash: null,
        eventHash: null,
      },
      {
        ...basePayload,
        previousHash: ZERO_HASH,
        eventHash: firstHash,
      },
    ]);

    expect(result.valid).toBe(true);
    expect(result.unhashedEventsSkipped).toBe(1);
    expect(result.hashedEventsChecked).toBe(1);
  });

  it('verifyChainRecords detects event hash tampering', () => {
    const firstHash = computeEventHash(basePayload, ZERO_HASH);
    const result = verifyChainRecords([
      {
        ...basePayload,
        previousHash: ZERO_HASH,
        eventHash: firstHash.slice(0, -1) + 'f',
      },
    ]);

    expect(result.valid).toBe(false);
    expect(result.tamperedReason).toBe('event_hash_mismatch');
    expect(result.tamperedEventId).toBe(basePayload.id);
  });

  it('verifyChainRecords detects previous hash mismatch', () => {
    const firstHash = computeEventHash(basePayload, ZERO_HASH);
    const secondPayload = {
      ...basePayload,
      id: '55555555-5555-4555-8555-555555555555',
    };
    const secondHash = computeEventHash(secondPayload, firstHash);

    const result = verifyChainRecords([
      {
        ...basePayload,
        previousHash: ZERO_HASH,
        eventHash: firstHash,
      },
      {
        ...secondPayload,
        previousHash: ZERO_HASH,
        eventHash: secondHash,
      },
    ]);

    expect(result.valid).toBe(false);
    expect(result.tamperedReason).toBe('previous_hash_mismatch');
  });
});
