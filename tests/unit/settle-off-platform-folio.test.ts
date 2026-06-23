import { describe, expect, it } from 'vitest';
import { folioMethodForRail } from '@/lib/services/payment/settleOffPlatformFolio';
import { resolveFolioPaymentGateway } from '@/lib/services/folio/FolioService';

describe('settleOffPlatformFolio helpers', () => {
  it('maps manual rails to folio payment methods', () => {
    expect(folioMethodForRail('eft')).toBe('eft');
    expect(folioMethodForRail('ewallet')).toBe('ewallet');
    expect(folioMethodForRail('bank_deposit')).toBe('bank_deposit');
  });
});

describe('resolveFolioPaymentGateway', () => {
  it('returns correct gateway labels for off-platform methods', () => {
    expect(resolveFolioPaymentGateway('eft')).toBe('bank_eft');
    expect(resolveFolioPaymentGateway('ewallet')).toBe('ewallet_aggregator');
    expect(resolveFolioPaymentGateway('bank_deposit')).toBe('bank_eft');
  });
});
