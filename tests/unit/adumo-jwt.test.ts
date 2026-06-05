import { createHmac } from 'crypto';
/**
 * Adumo Virtual JWT — production confidence tests
 *
 * Purpose: Verify JWT token generation, validation, amount matching, result codes,
 * and webhook HMAC verification match the Adumo Online official spec.
 *
 * Spec reference: Adumo Online Virtual Integration Documentation (June 2026)
 * Location: tests/unit/adumo-jwt.test.ts
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import jwt from 'jsonwebtoken';

// Use the real test credentials from the Adumo docs
const TEST_MERCHANT_UID = '9BA5008C-08EE-4286-A349-54AF91A621B0';
const TEST_APPLICATION_UID = '23ADADC0-DA2D-4DAC-A128-4845A5D71293';
const TEST_JWT_SECRET = 'yglTxLCSMm7PEsfaMszAKf2LSRvM2qVW';

vi.stubEnv('ADUMO_MERCHANT_UID', TEST_MERCHANT_UID);
vi.stubEnv('ADUMO_APPLICATION_UID', TEST_APPLICATION_UID);
vi.stubEnv('ADUMO_JWT_SECRET', TEST_JWT_SECRET);
vi.stubEnv('ADUMO_BASE_URL', 'https://staging-apiv3.adumoonline.com');
vi.stubEnv('ADUMO_CURRENCY_CODE', 'NAD');

describe('AdumoVirtualService — JWT generation', () => {
  let AdumoVirtualService: typeof import('@/lib/services/payment/AdumoVirtualService').AdumoVirtualService;

  beforeEach(async () => {
    vi.resetModules();
    const mod = await import('@/lib/services/payment/AdumoVirtualService');
    AdumoVirtualService = mod.AdumoVirtualService;
  });

  it('generates a valid HS256 JWT with all required fields', () => {
    const token = AdumoVirtualService.createRequestToken({
      amount: '150.00',
      merchantReference: 'HE123456789abc',
    });

    const decoded = jwt.decode(token, { complete: true });
    expect(decoded?.header.alg).toBe('HS256');
    expect(decoded?.header.typ).toBe('JWT');

    const payload = decoded?.payload as Record<string, unknown>;
    expect(payload.cuid).toBe(TEST_MERCHANT_UID);
    expect(payload.auid).toBe(TEST_APPLICATION_UID);
    expect(payload.amount).toBe('150.00');
    expect(payload.mref).toBe('HE123456789abc');
    expect(payload.iss).toBe('Hotel Etuna');
    expect(typeof payload.jti).toBe('string');
    expect(payload.jti).toHaveLength(44); // base64 of 32 random bytes
    expect(typeof payload.iat).toBe('number');
    expect(typeof payload.exp).toBe('number');
  });

  it('JWT expiry is 10 minutes (600s) from issue time', () => {
    const before = Math.floor(Date.now() / 1000);
    const token = AdumoVirtualService.createRequestToken({ amount: '100.00', merchantReference: 'TEST1' });
    const after = Math.floor(Date.now() / 1000);

    const payload = jwt.decode(token) as Record<string, number>;
    const ttl = payload.exp - payload.iat;
    expect(ttl).toBeGreaterThanOrEqual(600);
    expect(ttl).toBeLessThanOrEqual(660); // allow for the 60s back-dating of iat
    // iat is set 60s in the past to handle clock skew
    expect(payload.iat).toBeLessThanOrEqual(before);
    expect(payload.exp).toBeGreaterThan(before + 598);
  });

  it('token is verifiable with the correct secret', () => {
    const token = AdumoVirtualService.createRequestToken({ amount: '50.00', merchantReference: 'VER001' });
    expect(() => jwt.verify(token, TEST_JWT_SECRET, { algorithms: ['HS256'] })).not.toThrow();
  });

  it('token is NOT verifiable with a wrong secret', () => {
    const token = AdumoVirtualService.createRequestToken({ amount: '50.00', merchantReference: 'VER002' });
    expect(() => jwt.verify(token, 'wrong-secret', { algorithms: ['HS256'] })).toThrow();
  });

  it('includes notificationURL in payload when provided', () => {
    const token = AdumoVirtualService.createRequestToken({
      amount: '75.00',
      merchantReference: 'NOTIF001',
      notificationURL: 'https://hoteletuna.com/api/webhooks/adumo',
    });

    const payload = jwt.decode(token) as Record<string, unknown>;
    expect(payload.notificationURL).toBe('https://hoteletuna.com/api/webhooks/adumo');
  });

  it('amount is always formatted as 2 decimal places', () => {
    const token = AdumoVirtualService.createRequestToken({ amount: '150', merchantReference: 'AMT001' });
    const payload = jwt.decode(token) as Record<string, unknown>;
    expect(payload.amount).toBe('150.00');
  });
});

describe('AdumoVirtualService — form payload', () => {
  let AdumoVirtualService: typeof import('@/lib/services/payment/AdumoVirtualService').AdumoVirtualService;

  beforeEach(async () => {
    vi.resetModules();
    const mod = await import('@/lib/services/payment/AdumoVirtualService');
    AdumoVirtualService = mod.AdumoVirtualService;
  });

  it('builds form with all Adumo-required mandatory fields', () => {
    const form = AdumoVirtualService.buildFormPayload({
      amount: 200,
      merchantReference: 'FORM001',
      redirectSuccessUrl: 'https://hoteletuna.com/payment/success',
      redirectFailedUrl: 'https://hoteletuna.com/payment/failed',
    });

    expect(form.fields.MerchantID).toBe(TEST_MERCHANT_UID);
    expect(form.fields.ApplicationID).toBe(TEST_APPLICATION_UID);
    expect(form.fields.Amount).toBe('200.00');
    expect(form.fields.Token).toBeDefined();
    expect(form.fields.RedirectSuccessfulURL).toBe('https://hoteletuna.com/payment/success');
    expect(form.fields.RedirectFailedURL).toBe('https://hoteletuna.com/payment/failed');
  });

  it('action URL points to staging initialisevirtual endpoint', () => {
    const form = AdumoVirtualService.buildFormPayload({ amount: 100, merchantReference: 'URL001' });
    expect(form.actionUrl).toBe('https://staging-apiv3.adumoonline.com/product/payment/v1/initialisevirtual');
  });

  it('MerchantReference is alphanumeric only, max 38 chars', () => {
    const ref = AdumoVirtualService.buildMerchantReference('550e8400-e29b-41d4-a716-446655440000');
    expect(ref).toMatch(/^[A-Za-z0-9]+$/);
    expect(ref.length).toBeLessThanOrEqual(38);
  });

  it('dining reference prefix is DR', () => {
    const ref = AdumoVirtualService.buildDiningMerchantReference('550e8400-e29b-41d4-a716-446655440000');
    expect(ref).toMatch(/^DR/);
    expect(ref.length).toBeLessThanOrEqual(38);
  });
});

describe('AdumoVirtualService — response token validation', () => {
  let AdumoVirtualService: typeof import('@/lib/services/payment/AdumoVirtualService').AdumoVirtualService;

  beforeEach(async () => {
    vi.resetModules();
    const mod = await import('@/lib/services/payment/AdumoVirtualService');
    AdumoVirtualService = mod.AdumoVirtualService;
  });

  function buildResponseToken(overrides: Record<string, unknown> = {}) {
    const payload = {
      cuid: TEST_MERCHANT_UID,
      auid: TEST_APPLICATION_UID,
      result: 0,
      mref: 'HE123TEST001',
      amount: '150.00',
      transactionIndex: 'tx-abc-123',
      ...overrides,
    };
    return jwt.sign(payload, TEST_JWT_SECRET, { algorithm: 'HS256' });
  }

  it('verifies a valid response token and extracts all fields', () => {
    const token = buildResponseToken();
    const decoded = AdumoVirtualService.verifyResponseToken(token);

    expect(decoded).not.toBeNull();
    expect(decoded!.result).toBe(0);
    expect(decoded!.mref).toBe('HE123TEST001');
    expect(decoded!.amount).toBe('150.00');
    expect(decoded!.cuid).toBe(TEST_MERCHANT_UID);
    expect(decoded!.auid).toBe(TEST_APPLICATION_UID);
    expect(decoded!.transactionIndex).toBe('tx-abc-123');
  });

  it('returns null for a token signed with wrong secret', () => {
    const badToken = jwt.sign({ cuid: TEST_MERCHANT_UID, result: 0 }, 'wrong-secret');
    expect(AdumoVirtualService.verifyResponseToken(badToken)).toBeNull();
  });

  it('returns null when cuid does not match configured merchant UID', () => {
    const token = buildResponseToken({ cuid: 'different-merchant-uid' });
    expect(AdumoVirtualService.verifyResponseToken(token)).toBeNull();
  });

  it('returns null when auid does not match configured application UID', () => {
    const token = buildResponseToken({ auid: 'different-app-uid' });
    expect(AdumoVirtualService.verifyResponseToken(token)).toBeNull();
  });

  it('returns null for an expired token', () => {
    const expired = jwt.sign(
      { cuid: TEST_MERCHANT_UID, auid: TEST_APPLICATION_UID, result: 0, exp: Math.floor(Date.now() / 1000) - 100 },
      TEST_JWT_SECRET
    );
    expect(AdumoVirtualService.verifyResponseToken(expired)).toBeNull();
  });

  it('returns null for malformed token string', () => {
    expect(AdumoVirtualService.verifyResponseToken('not.a.valid.jwt')).toBeNull();
    expect(AdumoVirtualService.verifyResponseToken('')).toBeNull();
  });
});

describe('AdumoVirtualService — result codes (spec: 0=success, 1=success+warning, -1=failed)', () => {
  let AdumoVirtualService: typeof import('@/lib/services/payment/AdumoVirtualService').AdumoVirtualService;

  beforeEach(async () => {
    vi.resetModules();
    const mod = await import('@/lib/services/payment/AdumoVirtualService');
    AdumoVirtualService = mod.AdumoVirtualService;
  });

  it('result 0 = successful', () => expect(AdumoVirtualService.isPaymentSuccess(0)).toBe(true));
  it('result 1 = successful with warning', () => expect(AdumoVirtualService.isPaymentSuccess(1)).toBe(true));
  it('result -1 = failed', () => expect(AdumoVirtualService.isPaymentSuccess(-1)).toBe(false));
  it('result 2 = failed (unknown)', () => expect(AdumoVirtualService.isPaymentSuccess(2)).toBe(false));
  it('redirect _RESULT "0" = success', () => expect(AdumoVirtualService.isRedirectSuccess('0')).toBe(true));
  it('redirect _RESULT "1" = success with warning', () => expect(AdumoVirtualService.isRedirectSuccess('1')).toBe(true));
  it('redirect _RESULT "-1" = failed', () => expect(AdumoVirtualService.isRedirectSuccess('-1')).toBe(false));
  it('redirect _RESULT null = failed', () => expect(AdumoVirtualService.isRedirectSuccess(null)).toBe(false));
});

describe('AdumoVirtualService — HMAC webhook verification', () => {
  let AdumoVirtualService: typeof import('@/lib/services/payment/AdumoVirtualService').AdumoVirtualService;

  beforeEach(async () => {
    vi.resetModules();
    vi.stubEnv('ADUMO_WEBHOOK_HMAC_SECRET', 'webhook-test-secret-32chars');
    const mod = await import('@/lib/services/payment/AdumoVirtualService');
    AdumoVirtualService = mod.AdumoVirtualService;
  });

  it('accepts valid HMAC signature', () => {
    const body = JSON.stringify({ token: 'test', merchantReference: 'HE001' });
    const sig = createHmac('sha256', 'webhook-test-secret-32chars').update(body).digest('hex');
    expect(AdumoVirtualService.verifyWebhookHmac(body, sig)).toBe(true);
  });

  it('rejects invalid HMAC signature', () => {
    const body = JSON.stringify({ token: 'test' });
    expect(AdumoVirtualService.verifyWebhookHmac(body, 'wrong-signature')).toBe(false);
  });

  it('passes through when HMAC secret not configured (optional)', async () => {
    vi.resetModules();
    vi.stubEnv('ADUMO_WEBHOOK_HMAC_SECRET', '');
    const mod = await import('@/lib/services/payment/AdumoVirtualService');
    // Without secret configured, any signature passes (webhook body validated by JWT instead)
    expect(mod.AdumoVirtualService.verifyWebhookHmac('any body', 'any sig')).toBe(true);
  });
});

describe('AdumoVirtualService — configuration detection', () => {
  it('reports configured when all 3 env vars present', async () => {
    vi.resetModules();
    const mod = await import('@/lib/services/payment/AdumoVirtualService');
    expect(mod.AdumoVirtualService.isConfigured()).toBe(true);
  });

  it('reports unconfigured when JWT secret missing', async () => {
    vi.resetModules();
    vi.stubEnv('ADUMO_JWT_SECRET', '');
    const mod = await import('@/lib/services/payment/AdumoVirtualService');
    expect(mod.AdumoVirtualService.isConfigured()).toBe(false);
  });
});
