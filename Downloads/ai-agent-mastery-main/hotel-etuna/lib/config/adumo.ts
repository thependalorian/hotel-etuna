export const adumoConfig = {
  apiKey: process.env.ADUMO_API_KEY || '',
  merchantId: process.env.ADUMO_MERCHANT_ID || '',
  merchantUid: process.env.ADUMO_MERCHANT_UID || '',
  applicationUid: process.env.ADUMO_APPLICATION_UID || '',
  clientId: process.env.ADUMO_CLIENT_ID || process.env.ADUMO_MERCHANT_UID || '',
  clientSecret:
    process.env.ADUMO_CLIENT_SECRET || process.env.ADUMO_APPLICATION_UID || '',
  baseUrl: process.env.ADUMO_BASE_URL || 'https://staging-apiv3.adumoonline.com',
};
