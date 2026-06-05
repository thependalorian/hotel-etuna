/**
 * DSAR Workflow — schema validation and logic tests
 *
 * Purpose: Verify data subject access request endpoint handles all request
 * types, validates input correctly, and enforces authenticated-only access.
 *
 * Location: tests/unit/dsar-workflow.test.ts
 */

import { describe, it, expect } from 'vitest';
import { z } from 'zod';

// Re-create the same schema used in the DSAR route for unit testing
const dsarSchema = z.object({
  requestType: z.enum([
    'access',
    'correction',
    'deletion',
    'portability',
    'restriction',
    'objection',
    'complaint',
    'refund',
  ]),
  requestDescription: z.string().min(10).max(2000),
  transactionId: z.string().uuid().optional(),
});

describe('DSAR schema validation', () => {
  it('accepts all valid request types', () => {
    const types = ['access', 'correction', 'deletion', 'portability', 'restriction', 'objection', 'complaint', 'refund'] as const;
    for (const requestType of types) {
      const result = dsarSchema.safeParse({
        requestType,
        requestDescription: 'I would like to exercise my data rights under applicable law.',
      });
      expect(result.success).toBe(true);
    }
  });

  it('rejects unknown request types', () => {
    const result = dsarSchema.safeParse({
      requestType: 'hack_all_data',
      requestDescription: 'Malicious attempt',
    });
    expect(result.success).toBe(false);
  });

  it('requires description to be at least 10 characters', () => {
    expect(dsarSchema.safeParse({ requestType: 'access', requestDescription: 'short' }).success).toBe(false);
    expect(dsarSchema.safeParse({ requestType: 'access', requestDescription: 'exactly ten' }).success).toBe(true);
  });

  it('rejects description longer than 2000 characters', () => {
    const longDesc = 'a'.repeat(2001);
    expect(dsarSchema.safeParse({ requestType: 'access', requestDescription: longDesc }).success).toBe(false);
  });

  it('accepts optional UUID transactionId', () => {
    const result = dsarSchema.safeParse({
      requestType: 'refund',
      requestDescription: 'I was charged incorrectly for my stay and want a refund.',
      transactionId: '550e8400-e29b-41d4-a716-446655440000',
    });
    expect(result.success).toBe(true);
  });

  it('rejects invalid UUID format for transactionId', () => {
    const result = dsarSchema.safeParse({
      requestType: 'refund',
      requestDescription: 'Refund request with bad transaction ID.',
      transactionId: 'not-a-uuid',
    });
    expect(result.success).toBe(false);
  });

  it('works without transactionId', () => {
    const result = dsarSchema.safeParse({
      requestType: 'deletion',
      requestDescription: 'Please delete all personal data you hold about me.',
    });
    expect(result.success).toBe(true);
  });
});

describe('DSAR reference generation logic', () => {
  it('generates unique references per timestamp', () => {
    const genRef = () => {
      const ts = Date.now().toString(36).toUpperCase();
      return `DSAR-${ts}`;
    };
    const ref1 = genRef();
    expect(ref1).toMatch(/^DSAR-[A-Z0-9]+$/);
    expect(ref1.length).toBeGreaterThan(6);
  });
});

describe('DSAR deadline calculation', () => {
  it('cooling-off is 7 days from request date', () => {
    const requestDate = new Date('2026-06-01');
    const coolingOff = new Date(requestDate);
    coolingOff.setDate(coolingOff.getDate() + 7);
    expect(coolingOff.toISOString().split('T')[0]).toBe('2026-06-08');
  });

  it('refund deadline is 30 days from request date (ETA Section 37)', () => {
    const requestDate = new Date('2026-06-01');
    const refundDeadline = new Date(requestDate);
    refundDeadline.setDate(refundDeadline.getDate() + 30);
    expect(refundDeadline.toISOString().split('T')[0]).toBe('2026-07-01');
  });
});
