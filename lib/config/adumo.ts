/**
 * Adumo Online Virtual — hosted payment page (form POST + JWT).
 * Location: lib/config/adumo.ts
 *
 * Namibia product uses Virtual only (initialisevirtual). 3DS runs on Adumo's page.
 *
 * Test env: ADUMO_BASE_URL=https://staging-apiv3.adumoonline.com
 * Production: ADUMO_BASE_URL=https://apiv3.adumoonline.com
 *
 * IMPORTANT: ADUMO_WEBHOOK_URL must be a public HTTPS URL in production.
 * Adumo cannot reach localhost — webhooks are skipped in local dev (redirect confirm handles it).
 *
 * ADUMO_PAYMENT_MODE env var is NOT used by code — remove it from .env.local if present.
 */

const stagingBase = 'https://staging-apiv3.adumoonline.com';
const liveBase = 'https://apiv3.adumoonline.com';

const baseUrl = process.env.ADUMO_BASE_URL || stagingBase;
const isLive = baseUrl.includes('apiv3.adumoonline.com') && !baseUrl.includes('staging');

export const adumoConfig = {
  baseUrl,
  isLive,

  merchantUid: process.env.ADUMO_MERCHANT_UID || process.env.ADUMO_MERCHANT_ID || '',
  applicationUid: process.env.ADUMO_APPLICATION_UID || process.env.ADUMO_APPLICATION_ID || '',

  virtualInitialiseUrl: `${baseUrl}/product/payment/v1/initialisevirtual`,
  jwtSecret: process.env.ADUMO_JWT_SECRET || '',
  currencyCode: process.env.ADUMO_CURRENCY_CODE || 'NAD',

  redirectSuccessUrl:
    process.env.ADUMO_REDIRECT_SUCCESS_URL ||
    `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/payment/success`,
  redirectFailedUrl:
    process.env.ADUMO_REDIRECT_FAIL_URL ||
    `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/payment/failed`,
  webhookNotificationUrl:
    process.env.ADUMO_WEBHOOK_URL ||
    `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/webhooks/adumo`,
};

export function adumoVirtualIsConfigured(): boolean {
  return Boolean(
    adumoConfig.merchantUid &&
      adumoConfig.applicationUid &&
      adumoConfig.jwtSecret
  );
}
