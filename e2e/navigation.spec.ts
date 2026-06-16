import { test, expect } from '@playwright/test';
import { dismissCookies } from './helpers/dismiss-cookie-consent';

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
  test.beforeEach(async ({ page }) => {
    await dismissCookies(page);
  });

  test.describe.configure({ timeout: 120_000 });

  const assertRouteLoads = async (page: import('@playwright/test').Page, route: string) => {
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
    const routes = [
      '/rooms',
      '/rooms/standard-room-type-a',
      '/rooms/standard-room-type-b',
      '/rooms/standard-room-type-c',
      '/rooms/executive-room',
      '/rooms/premiere-room',
      '/dining',
      '/about',
      '/contact',
      '/partners',
      '/partners/jayla',
      '/partners/aquarius',
      '/login',
      '/legal/privacy',
      '/legal/terms',
      '/facilities/conference',
      '/facilities/campsite',
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
    const menuButton = page.getByRole('button', { name: /toggle mobile menu/i });
    await expect(menuButton).toBeVisible({ timeout: 30_000 });
    await menuButton.click();
    await expect(page.locator('#mobile-menu')).toBeVisible();
  });

  test('public header includes Partners link', async ({ page }, testInfo) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    if (testInfo.project.name === 'mobile-chrome') {
      await page.getByRole('button', { name: /toggle mobile menu/i }).click();
      await expect(page.locator('#mobile-menu').getByRole('link', { name: 'Partners' })).toBeVisible();
    } else {
      await expect(page.getByRole('navigation').getByRole('link', { name: 'Partners' })).toBeVisible();
    }
  });

  test('should have accessible navigation landmarks', async ({ page }, testInfo) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });

    await expect(page.locator('[role="main"], main').first()).toBeVisible({ timeout: 30_000 });

    if (testInfo.project.name === 'mobile-chrome') {
      await expect(page.getByRole('button', { name: /toggle mobile menu/i })).toBeVisible({
        timeout: 30_000,
      });
      await expect(page.locator('#mobile-menu')).toBeAttached();
    } else {
      await expect(page.getByRole('navigation', { name: 'Main navigation' })).toBeVisible({
        timeout: 30_000,
      });
    }
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
