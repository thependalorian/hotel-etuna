/**
 * Validate Adumo Virtual wiring — run: npm run validate:adumo
 * Location: scripts/validate-adumo-virtual.ts
 *
 * No network calls to Adumo; checks config, JWT/form payload, response verification,
 * redirect URL consistency, and lifecycle file presence.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { config as loadDotenv } from 'dotenv';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
loadDotenv({ path: path.join(root, '.env.local') });
loadDotenv({ path: path.join(root, '.env') });

async function main() {
  const jwt = (await import('jsonwebtoken')).default;
  const { adumoConfig, adumoVirtualIsConfigured } = await import('../lib/config/adumo');
  const { AdumoVirtualService } = await import('../lib/services/payment/AdumoVirtualService');

  const failures: string[] = [];

  function assert(cond: boolean, msg: string) {
    if (!cond) failures.push(msg);
  }

  const TEST_MERCHANT = process.env.ADUMO_MERCHANT_UID || '9BA5008C-08EE-4286-A349-54AF91A621B0';
  const TEST_APP = process.env.ADUMO_APPLICATION_UID || '23ADADC0-DA2D-4DAC-A128-4845A5D71293';
  const TEST_SECRET = process.env.ADUMO_JWT_SECRET || 'yglTxLCSMm7PEsfaMszAKf2LSRvM2qVW';

  assert(adumoVirtualIsConfigured(), 'adumoVirtualIsConfigured() is false — set ADUMO_MERCHANT_UID, ADUMO_APPLICATION_UID, ADUMO_JWT_SECRET');
  assert(AdumoVirtualService.isConfigured(), 'AdumoVirtualService.isConfigured() is false');
  assert(Boolean(adumoConfig.virtualInitialiseUrl), 'virtualInitialiseUrl is empty');
  assert(
    adumoConfig.virtualInitialiseUrl.endsWith('/product/payment/v1/initialisevirtual'),
    `virtualInitialiseUrl must end with /product/payment/v1/initialisevirtual (got ${adumoConfig.virtualInitialiseUrl})`,
  );

  const base = adumoConfig.baseUrl;
  if (base.includes('staging')) {
    assert(
      adumoConfig.virtualInitialiseUrl.includes('staging-apiv3.adumoonline.com'),
      'Staging ADUMO_BASE_URL must use staging-apiv3 host',
    );
  } else if (base.includes('apiv3.adumoonline.com')) {
    assert(!adumoConfig.virtualInitialiseUrl.includes('staging'), 'Live ADUMO_BASE_URL must not use staging host');
  }

  const mref = `VAL${Date.now().toString(36)}`;
  const reqToken = AdumoVirtualService.createRequestToken({
    amount: '99.50',
    merchantReference: mref,
    notificationURL: adumoConfig.webhookNotificationUrl,
  });
  const reqPayload = jwt.decode(reqToken) as Record<string, unknown> | null;
  assert(reqPayload !== null, 'createRequestToken produced undecodable JWT');
  if (reqPayload) {
    for (const key of ['iss', 'cuid', 'auid', 'amount', 'mref', 'jti', 'iat', 'exp', 'notificationURL'] as const) {
      assert(key in reqPayload, `Request JWT missing claim: ${key}`);
    }
    assert(reqPayload.cuid === adumoConfig.merchantUid, 'Request JWT cuid must match ADUMO_MERCHANT_UID');
    assert(reqPayload.auid === adumoConfig.applicationUid, 'Request JWT auid must match ADUMO_APPLICATION_UID');
    assert(reqPayload.amount === '99.50', 'Request JWT amount must be 2dp string');
    assert(reqPayload.notificationURL === adumoConfig.webhookNotificationUrl, 'notificationURL must match ADUMO_WEBHOOK_URL');
  }

  const form = AdumoVirtualService.buildFormPayload({
    amount: 150,
    merchantReference: mref,
  });
  assert(form.actionUrl === adumoConfig.virtualInitialiseUrl, 'buildFormPayload actionUrl must match config virtualInitialiseUrl');
  assert(form.fields.MerchantID === adumoConfig.merchantUid, 'Form MerchantID mismatch');
  assert(form.fields.ApplicationID === adumoConfig.applicationUid, 'Form ApplicationID mismatch');
  assert(Boolean(form.fields.Token), 'Form Token missing');
  assert(form.fields.txtCurrencyCode === adumoConfig.currencyCode, 'Form txtCurrencyCode mismatch');
  assert(
    form.fields.RedirectSuccessfulURL === adumoConfig.redirectSuccessUrl,
    'Form RedirectSuccessfulURL must match ADUMO_REDIRECT_SUCCESS_URL',
  );
  assert(
    form.fields.RedirectFailedURL === adumoConfig.redirectFailedUrl,
    'Form RedirectFailedURL must match ADUMO_REDIRECT_FAIL_URL',
  );

  const appUrl = (process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000').replace(/\/$/, '');
  if (!process.env.ADUMO_REDIRECT_SUCCESS_URL) {
    assert(
      adumoConfig.redirectSuccessUrl.startsWith(appUrl),
      'Default redirect success URL should align with NEXT_PUBLIC_APP_URL when ADUMO_REDIRECT_SUCCESS_URL unset',
    );
  }

  function signResponse(overrides: Record<string, unknown> = {}) {
    return jwt.sign(
      {
        cuid: TEST_MERCHANT,
        auid: TEST_APP,
        result: 0,
        mref,
        amount: '99.50',
        transactionIndex: 'tx-validate-001',
        ...overrides,
      },
      TEST_SECRET,
      { algorithm: 'HS256' },
    );
  }

  assert(AdumoVirtualService.verifyResponseToken(signResponse()) !== null, 'Valid response token should verify');
  assert(AdumoVirtualService.verifyResponseToken(signResponse({ cuid: 'wrong' })) === null, 'Wrong cuid must reject');
  assert(AdumoVirtualService.verifyResponseToken(signResponse({ auid: 'wrong' })) === null, 'Wrong auid must reject');
  assert(AdumoVirtualService.isPaymentSuccess(0), 'result 0 must be success');
  assert(AdumoVirtualService.isPaymentSuccess(1), 'result 1 must be success');
  assert(!AdumoVirtualService.isPaymentSuccess(-1), 'result -1 must fail');

  const requiredFiles = [
    'lib/services/payment/completeAdumoVirtualPayment.ts',
    'app/api/payments/virtual/initiate/route.ts',
    'app/api/payments/virtual/confirm/route.ts',
    'app/api/webhooks/adumo/route.ts',
    'components/payments/AdumoVirtualPaymentForm.tsx',
  ];
  for (const rel of requiredFiles) {
    assert(fs.existsSync(path.join(root, rel)), `Missing lifecycle file: ${rel}`);
  }

  const completeSrc = fs.readFileSync(path.join(root, 'lib/services/payment/completeAdumoVirtualPayment.ts'), 'utf8');
  assert(completeSrc.includes('completeAdumoVirtualPayment'), 'completeAdumoVirtualPayment export missing');
  const webhookSrc = fs.readFileSync(path.join(root, 'app/api/webhooks/adumo/route.ts'), 'utf8');
  assert(webhookSrc.includes('completeAdumoVirtualPayment'), 'Webhook must call completeAdumoVirtualPayment');

  if (failures.length > 0) {
    console.error('Adumo Virtual validation FAILED:\n');
    for (const f of failures) console.error(`  ✗ ${f}`);
    process.exit(1);
  }

  console.log('Adumo Virtual validation OK');
  console.log(`  base: ${adumoConfig.baseUrl} (live=${adumoConfig.isLive})`);
  console.log(`  initialise: ${adumoConfig.virtualInitialiseUrl}`);
  console.log(`  redirect success: ${adumoConfig.redirectSuccessUrl}`);
  console.log(`  webhook: ${adumoConfig.webhookNotificationUrl}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
