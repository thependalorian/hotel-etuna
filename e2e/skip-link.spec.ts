import { test, expect } from '@playwright/test';

/**
 * UX-PUBLIC-08 — skip link reaches main content landmark.
 */

test.describe('Skip link', () => {
  test('focuses main content from skip link on homepage', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('load');

    const skipLink = page.getByRole('link', { name: /skip to main content/i });
    await expect(skipLink).toBeAttached();

    await skipLink.focus();
    await expect(skipLink).toBeFocused();

    await skipLink.click();
    await expect(page.locator('#main-content')).toBeVisible();
  });
});
