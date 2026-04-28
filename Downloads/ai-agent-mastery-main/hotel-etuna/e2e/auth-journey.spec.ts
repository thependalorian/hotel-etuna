import { test, expect } from '@playwright/test';
import { loadEnvFiles } from './helpers/load-env';
import { getVerificationOtpForEmail } from './helpers/db-otp';

/**
 * Full UI journey: register → OTP from DB → verify → login → host shell routes.
 * Requires DATABASE_URL in `.env.local` (same DB as dev server).
 */
test.describe('Full auth journey', () => {
  test.describe.configure({ timeout: 180_000 });

  test.beforeAll(() => {
    loadEnvFiles();
  });

  test('register → verify email → login → properties, dashboard, settings', async ({
    page,
  }) => {
    test.skip(!process.env.DATABASE_URL, 'Set DATABASE_URL in .env.local to run this test.');

    const email = `e2e-pw-${Date.now()}@example.com`;
    const password = 'E2ePlaywright1!';
    const name = 'E2E Playwright';

    await page.goto('/register');
    await page.getByPlaceholder('John Doe').fill(name);
    await page.getByPlaceholder('your@email.com').fill(email);
    await page.getByPlaceholder('Create a strong password').fill(password);
    await page.getByRole('button', { name: 'Create Free Account' }).click();

    await expect(page).toHaveURL(/\/verify-email/, { timeout: 90_000 });
    await expect(page.getByRole('heading', { name: /verify your email/i })).toBeVisible();

    const otp = await getVerificationOtpForEmail(email);
    await page.locator('#otp').fill(otp);
    await page.getByRole('button', { name: 'Verify Email' }).click();

    await expect(page).toHaveURL(/\/login/, { timeout: 20_000 });

    await page.getByLabel('Email Address').fill(email);
    await page.getByLabel('Password').fill(password);
    await page.getByRole('button', { name: 'Sign In' }).click();

    const origin = new URL(page.url()).origin;
    const api = page.context().request;

    await expect
      .poll(
        async () => {
          const res = await api.get(`${origin}/api/auth/session`);
          const data = (await res.json()) as { user?: { email?: string } };
          return data?.user?.email === email;
        },
        { timeout: 90_000 },
      )
      .toBe(true);

    await page.goto('/properties');
    await expect(page).toHaveURL(/\/properties/, { timeout: 30_000 });

    await page.goto('/dashboard');
    await expect(page).toHaveURL(/\/dashboard/);

    await page.goto('/settings');
    await expect(page).toHaveURL(/\/settings/);
  });
});
