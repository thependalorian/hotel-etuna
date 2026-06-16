import { test, expect } from '@playwright/test';
import { dismissCookies } from './helpers/dismiss-cookie-consent';
import { loginAsGuest } from './helpers/login';
import { loadEnvFiles } from './helpers/load-env';

/**
 * UX-PAY-02 — NamQR notify step gated until QR is shown (guest folio).
 * Uses login redirect guard: unauthenticated users should not see notify CTA on stay URL.
 */

test.describe('Guest NamQR step order', () => {
  test.describe.configure({ timeout: 180_000 });

  test.beforeAll(() => {
    loadEnvFiles();
  });

  test.beforeEach(async ({ page }) => {
    await dismissCookies(page);
  });

  test('stay folio redirects unauthenticated users before NamQR panel', async ({ page }) => {
    await page.goto('/guest/stays/00000000-0000-0000-0000-000000000001', {
      waitUntil: 'domcontentloaded',
    });

    await expect(page).toHaveURL(/\/login/);
    await expect(page.getByRole('button', { name: /i've paid/i })).not.toBeVisible();
  });

  test('authenticated guest hub uses pill navigation links', async ({ page }) => {
    test.skip(!process.env.DATABASE_URL, 'Set DATABASE_URL in .env.local to run this test.');

    await loginAsGuest(page);

    await expect(page.getByRole('navigation', { name: 'Guest navigation' })).toBeVisible();
    const overview = page.getByRole('link', { name: 'Overview' });
    await expect(overview).toBeVisible();
    const radius = await overview.evaluate((el) => window.getComputedStyle(el).borderRadius);
    expect(parseFloat(radius)).toBeGreaterThan(8);
  });
});
