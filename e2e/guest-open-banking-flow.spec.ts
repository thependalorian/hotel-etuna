import { test, expect } from '@playwright/test';

/**
 * Guest Open Banking OAuth sandbox — consent screen + return (UX-PAY-03).
 */

test.describe('Guest Open Banking redirect', () => {
  test('invalid consent link shows expired state', async ({ page }) => {
    await page.goto('/payment/open-banking/consent?booking_id=x&amount=10&return_url=http://localhost:3000/payment/open-banking/return');
    await page.waitForLoadState('load');
    await expect(page.getByRole('heading', { name: /bank link expired/i })).toBeVisible();
  });

  test('authorize API requires authentication', async ({ request }) => {
    const res = await request.post('/api/payments/open-banking/authorize', {
      data: {
        bookingId: '00000000-0000-0000-0000-000000000001',
        amount: 50,
      },
    });
    expect(res.status()).toBe(401);
  });
});
