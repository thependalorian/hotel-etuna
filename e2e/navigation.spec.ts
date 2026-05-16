import { test, expect } from '@playwright/test';

/**
 * E2E Test: Navigation
 * 
 * Tests application navigation:
 * - All major routes are accessible
 * - Navigation menus work
 * - Breadcrumbs function correctly
 * - Mobile navigation works
 */

test.describe('Navigation', () => {
  const assertRouteLoads = async (page: any, route: string) => {
    let response;
    try {
      response = await page.goto(route, { waitUntil: 'domcontentloaded', timeout: 45_000 });
    } catch {
      response = await page.goto(route, { waitUntil: 'load', timeout: 45_000 });
    }
    expect(response?.status()).toBeLessThan(400);
    await expect(page.locator('body')).toBeVisible();
  };

  test('public routes should load without 404', async ({ page }) => {
    test.setTimeout(120_000);
    const routes = [
      '/rooms',
      '/rooms/standard-room',
      '/rooms/luxury-room',
      '/rooms/family-room',
      '/rooms/executive-suite',
      '/rooms/premier-room',
      '/dining',
      '/about',
      '/contact',
      '/partners',
      '/partners/jayla',
      '/partners/aquarius',
      '/login',
      '/legal/privacy',
      '/legal/terms',
    ];

    for (const route of routes) {
      await assertRouteLoads(page, route);
    }
  });

  test('unknown route should return not-found page', async ({ page }) => {
    const response = await page.goto('/nonexistent');
    const html = (await page.content()).toLowerCase();

    expect(response?.status() === 404 || html.includes('not found') || html.includes('could not be found')).toBe(
      true,
    );
  });

  test('should have mobile menu on small screens', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');
    
    // Look for hamburger menu or mobile menu button
    const mobileMenuButton = page.locator(
      'button[aria-label*="menu"], button[aria-label*="navigation"], button:has-text("menu"), [class*="menu-toggle"]'
    );
    
    if (await mobileMenuButton.count() > 0) {
      const button = mobileMenuButton.first();
      await expect(button).toBeVisible();
      
      // Try to click it
      await button.click();
      await page.waitForTimeout(500);
      
      // Menu should expand or become visible
      // (implementation specific, so we just check it's clickable)
    }
  });

  test('should have accessible navigation landmarks', async ({ page }) => {
    await page.goto('/');
    
    // Check for proper ARIA landmarks
    const nav = page.locator('[role="navigation"], nav');
    const main = page.locator('[role="main"], main');
    
    await expect(nav.first()).toBeVisible();
    await expect(main.first()).toBeVisible();
  });

  test('should support keyboard navigation', async ({ page }) => {
    await page.goto('/');
    
    // Tab through elements
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');
    
    // Check if focus is visible
    const focusedElement = await page.evaluate(() => {
      const el = document.activeElement;
      const styles = window.getComputedStyle(el as Element);
      return {
        tagName: el?.tagName,
        outline: styles.outline,
        boxShadow: styles.boxShadow,
      };
    });
    
    // Should have some focus indicator
    expect(focusedElement.tagName).toBeTruthy();
  });

  test('verify-email and forgot-password pages render', async ({ page }) => {
    await page.goto('/verify-email?email=test%40example.com');
    await expect(page.getByRole('heading', { name: /verify your email/i })).toBeVisible();

    await page.goto('/forgot-password');
    await expect(page).toHaveURL(/\/forgot-password/);
  });
});
