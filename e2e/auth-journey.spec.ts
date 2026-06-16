import { test, expect } from '@playwright/test';
import { loadEnvFiles } from './helpers/load-env';
import { dismissCookies } from './helpers/dismiss-cookie-consent';
import { registerGuestViaApi, completeVerifyEmailUi } from './helpers/login';

/**
 * Full UI journey: API register → OTP verify UI → login UI → guest hub routes.
 * Requires DATABASE_URL in `.env.local` (same DB as dev server).
 */
test.describe('Full auth journey', () => {
  test.describe.configure({ timeout: 180_000 });

  test.beforeAll(() => {
    loadEnvFiles();
  });

  test.beforeEach(async ({ page }) => {
    await dismissCookies(page);
  });

  test('register → verify email → login → guest hub and profile', async ({ page, baseURL }) => {
    test.skip(!process.env.DATABASE_URL, 'Set DATABASE_URL in .env.local to run this test.');

    const email = `e2e-pw-${Date.now()}@example.com`;
    const password = 'E2ePlaywright1!';
    const name = 'E2E Playwright';
    const origin = (baseURL ?? 'http://127.0.0.1:3010').replace(/\/$/, '');

    const otp = await registerGuestViaApi(page.context().request, origin, { name, email, password });

    await page.goto(`/verify-email?email=${encodeURIComponent(email)}`, {
      waitUntil: 'domcontentloaded',
    });
    await completeVerifyEmailUi(page, otp, email);

    await page.getByLabel(/email/i).fill(email);
    await page.getByLabel(/password/i).fill(password);
    await page.getByRole('button', { name: /sign in/i }).click();
    await page.waitForURL(/\/guest/, { timeout: 90_000 });

    await expect(page.getByRole('navigation', { name: 'Guest navigation' })).toBeVisible();

    await page.goto('/guest/profile', { waitUntil: 'domcontentloaded' });
    await expect(page).toHaveURL(/\/guest\/profile/);
  });
});
