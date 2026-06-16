import { test, expect } from '@playwright/test';

/**
 * Public partner book page — marketing chrome (UX-PUBLIC-04 / P6).
 * Verifies NavigationHeader, main landmark, and footer on public-properties book routes.
 */
test.describe('Public book page chrome', () => {
  test('renders marketing shell around booking form', async ({ page }) => {
    await page.goto('/public-properties/hotel-etuna/book');
    await page.waitForLoadState('load');

    await expect(page.locator('#main-content')).toBeVisible();
    await expect(page.getByRole('heading', { name: /book your stay/i })).toBeVisible();
    await expect(page.locator('footer')).toBeVisible();
    await expect(page.getByRole('link', { name: /book your stay|hotel etuna/i }).first()).toBeVisible();
  });
});
