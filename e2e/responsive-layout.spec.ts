import { test, expect } from '@playwright/test';

/**
 * Responsive layout E2E — no horizontal overflow on key public routes.
 * Location: e2e/responsive-layout.spec.ts
 */

const PUBLIC_ROUTES = ['/', '/rooms', '/dining', '/contact'] as const;

async function assertNoHorizontalOverflow(page: import('@playwright/test').Page) {
  const metrics = await page.evaluate(() => {
    const doc = document.documentElement;
    return {
      scrollWidth: doc.scrollWidth,
      clientWidth: doc.clientWidth,
    };
  });
  expect(metrics.scrollWidth).toBeLessThanOrEqual(metrics.clientWidth + 24);
}

test.describe('Responsive layout', () => {
  test.beforeEach(async ({ page }) => {
    test.setTimeout(90_000);
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
  });

  for (const route of PUBLIC_ROUTES) {
    test(`no horizontal overflow on ${route}`, async ({ page }) => {
      await page.goto(route, { waitUntil: 'domcontentloaded' });
      await expect(page.locator('body')).toBeVisible();
      await assertNoHorizontalOverflow(page);
    });
  }

  test('mobile nav toggle opens menu on homepage', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'mobile-chrome', 'Mobile project only');

    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');

    const menuButton = page.getByRole('button', { name: /toggle mobile menu/i });
    await expect(menuButton).toBeVisible();
    await menuButton.click();

    const mobileNav = page.getByRole('dialog', { name: 'Mobile navigation' });
    await expect(mobileNav).toBeVisible();
    await expect(mobileNav.getByRole('link', { name: 'Rooms' })).toBeVisible();
  });

  test('rooms filmstrip is scrollable or grid on narrow viewports', async ({ page }) => {
    await page.goto('/rooms', { waitUntil: 'domcontentloaded' });
    const tourSection = page.getByRole('region', { name: 'Room types' });
    await expect(tourSection).toBeVisible({ timeout: 15_000 });
    await assertNoHorizontalOverflow(page);
  });
});
