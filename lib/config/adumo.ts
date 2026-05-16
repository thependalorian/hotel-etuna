/**
 * Adumo Online configuration — Virtual (hosted page) + Enterprise (server-side card API).
 * Location: lib/config/adumo.ts
 */

const stagingBase = 'https://staging-apiv3.adumoonline.com';
const liveBase = 'https://apiv3.adumoonline.com';

const baseUrl = process.env.ADUMO_BASE_URL || stagingBase;
const isLive = baseUrl.includes('apiv3.adumoonline.com') && !baseUrl.includes('staging');

export const adumoConfig = {
  baseUrl,
  isLive,

  /** Enterprise OAuth (optional — server-posted PAN path) */
  merchantUid: process.env.ADUMO_MERCHANT_UID || process.env.ADUMO_MERCHANT_ID || '',
  applicationUid: process.env.ADUMO_APPLICATION_UID || process.env.ADUMO_APPLICATION_ID || '',
  clientId: process.env.ADUMO_CLIENT_ID || process.env.ADUMO_MERCHANT_UID || '',
  clientSecret: process.env.ADUMO_CLIENT_SECRET || '',

  /** Virtual hosted page (preferred for guest checkout — SAQ A) */
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

  /** virtual | enterprise — default virtual when JWT secret is set */
  paymentMode:
    process.env.ADUMO_PAYMENT_MODE ||
    (process.env.ADUMO_JWT_SECRET ? 'virtual' : 'enterprise'),
};

export function adumoVirtualIsConfigured(): boolean {
  return Boolean(
    adumoConfig.merchantUid &&
      adumoConfig.applicationUid &&
      adumoConfig.jwtSecret
  );
}
