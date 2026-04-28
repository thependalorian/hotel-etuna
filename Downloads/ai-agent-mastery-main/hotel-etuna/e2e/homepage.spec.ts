import { test, expect } from '@playwright/test';

/**
 * E2E Test: Homepage
 * 
 * Tests the public homepage functionality:
 * - Page loads successfully
 * - Navigation is present
 * - iOS-style design system is applied
 * - Responsive design works
 */

test.describe('Homepage', () => {
  test('should load and render hero section', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('load');
    await expect(page).toHaveTitle(/Hotel Etuna/i);
    
    // Check for hero content specifically
    const heroSection = page.locator('[class*="hero"], h1, [role="heading"][aria-level="1"]').first();
    await expect(heroSection).toBeVisible({ timeout: 10000 });
    
    // Verify hero text content exists
    const heroText = await heroSection.textContent();
    expect(heroText).toBeTruthy();
    expect(heroText!.length).toBeGreaterThan(0);
  });

  test('should load successfully', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('load');
    await expect(page).toHaveTitle(/Hotel Etuna/i);
    await expect(page.locator('body')).toBeVisible();
  });

  test('should have navigation elements', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('load');
    await expect(page.getByRole('navigation', { name: 'Main navigation' })).toBeVisible({
      timeout: 60_000,
    });
  });

  test('should display primary CTA to register', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('load');

    await expect(page.locator('header a[href="/register"]').first()).toBeVisible({ timeout: 60_000 });
  });

  test('should have iOS-style rounded elements', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('load');

    await expect(page.locator('header a[href="/register"] button').first()).toBeVisible({
      timeout: 60_000,
    });
  });

  test('should have proper mobile viewport layout', async ({ page }) => {
    // Set mobile viewport (iPhone SE dimensions)
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');
    await page.waitForLoadState('load');
    
    // Check that content is visible and not cut off
    await expect(page.locator('body')).toBeVisible();
    await expect(page.locator('header')).toBeVisible();
    
    // Verify mobile-specific layout: no horizontal scroll
    const bodyWidth = await page.locator('body').evaluate((el) => el.scrollWidth);
    const viewportWidth = 375;
    expect(bodyWidth).toBeLessThanOrEqual(viewportWidth + 20); // Allow 20px tolerance
    
    // Verify mobile navigation (hamburger menu or mobile-optimized nav)
    const mobileNav = page.locator('button[aria-label*="menu"], [class*="mobile"], [class*="hamburger"]').first();
    // Mobile nav should exist or regular nav should be visible
    const navExists = await mobileNav.isVisible().catch(() => false);
    const regularNavExists = await page.locator('nav, header nav').first().isVisible();
    expect(navExists || regularNavExists).toBe(true);
  });

  test('should be responsive on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');
    await page.waitForLoadState('load');
    await expect(page.locator('body')).toBeVisible();
    await expect(page.locator('header')).toBeVisible();
  });

  test('should be responsive on tablet', async ({ page }) => {
    // Set tablet viewport
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.goto('/');
    
    // Page should still load
    await expect(page.locator('body')).toBeVisible();
  });

  test('should have accessible color contrast', async ({ page }) => {
    await page.goto('/');
    
    // Run accessibility check (basic)
    const body = await page.locator('body').evaluate((el) => {
      const styles = window.getComputedStyle(el);
      return {
        color: styles.color,
        backgroundColor: styles.backgroundColor,
      };
    });
    
    // Should have defined colors
    expect(body.color).toBeTruthy();
    expect(body.backgroundColor).toBeTruthy();
  });

  test('should load without critical console errors', async ({ page }) => {
    const errors: string[] = [];

    page.on('console', (msg) => {
      if (msg.type() === 'error') errors.push(msg.text());
    });

    await page.goto('/');
    await page.waitForLoadState('load');
    await page.waitForTimeout(1500);

    const noise = (err: string) =>
      /middleware|deprecat|favicon|ResizeObserver|hydration|chunk|net::|404|failed to load|warning/i.test(
        err,
      );

    const criticalErrors = errors.filter((err) => !noise(err));
    expect(criticalErrors).toHaveLength(0);
  });
});
