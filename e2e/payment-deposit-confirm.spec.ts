import { test, expect } from '@playwright/test';
import { dismissCookies } from './helpers/dismiss-cookie-consent';

/**
 * UX-PAY-01 — deposit requires explicit confirm before Adumo redirect.
 */

test.describe('Booking deposit confirmation', () => {
  test.describe.configure({ timeout: 120_000 });

  test.beforeEach(async ({ page }) => {
    await dismissCookies(page);
  });

  test('does not auto-redirect to Adumo on page load', async ({ page }) => {
    await page.goto('/payment/booking-deposit?bookingId=00000000-0000-0000-0000-000000000001', {
      waitUntil: 'domcontentloaded',
    });

    await expect(page.getByText(/redirecting to secure card payment/i)).not.toBeVisible();
    await expect(page.getByRole('heading', { name: /secure deposit payment/i })).toBeVisible({
      timeout: 60_000,
    });

    const cardBody = page.locator('.card-body');
    const payCta = cardBody.getByRole('button', { name: /pay.*with card/i });
    const depositMessage = cardBody.locator('[role="alert"]');
    const hasPay = await payCta.isVisible().catch(() => false);
    const hasMessage = await depositMessage.first().isVisible().catch(() => false);
    expect(hasPay || hasMessage).toBe(true);
  });
});
