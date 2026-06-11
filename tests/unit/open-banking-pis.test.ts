/**
 * Open Banking PIS — schema and intent classification tests
 * Location: tests/unit/open-banking-pis.test.ts
 */

import { describe, it, expect } from 'vitest';
import { z } from 'zod';

const makePaymentSchema = z.object({
  payerAccountId: z.string().uuid(),
  payeeIdentifier: z.string().min(3).max(128),
  payeeName: z.string().min(1).max(140),
  payeeAccountType: z.enum(['bank', 'ewallet', 'card']),
  amount: z.number().positive().max(1_000_000),
  currency: z.literal('NAD'),
  paymentStream: z.enum(['NRTC', 'EnCR']),
  authMethod: z.enum(['otp_sms', 'biometric', 'app_pin']),
  authValue: z.string().min(4).max(256),
});

describe('BON PIS Make Payment schema', () => {
  const valid = {
    payerAccountId: '550e8400-e29b-41d4-a716-446655440000',
    payeeIdentifier: 'etuna@fnb',
    payeeName: 'Hotel Etuna',
    payeeAccountType: 'bank' as const,
    amount: 1500,
    currency: 'NAD' as const,
    paymentStream: 'NRTC' as const,
    authMethod: 'otp_sms' as const,
    authValue: '123456',
  };

  it('accepts valid NRTC payment with 2FA', () => {
    expect(makePaymentSchema.safeParse(valid).success).toBe(true);
  });

  it('rejects non-NAD currency', () => {
    expect(makePaymentSchema.safeParse({ ...valid, currency: 'USD' }).success).toBe(false);
  });

  it('rejects missing authValue (PSD-12 step-up)', () => {
    expect(makePaymentSchema.safeParse({ ...valid, authValue: 'abc' }).success).toBe(false);
  });

  it('rejects zero amount', () => {
    expect(makePaymentSchema.safeParse({ ...valid, amount: 0 }).success).toBe(false);
  });
});
