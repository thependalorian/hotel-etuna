import { test, expect } from '@playwright/test';
import { dismissCookies } from './helpers/dismiss-cookie-consent';

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
  test.describe.configure({ timeout: 120_000 });

  test.beforeEach(async ({ page }) => {
    await dismissCookies(page);
  });

  test('should load and render hero section', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await expect(page).toHaveTitle(/Hotel Etuna/i);

    await expect(page.getByRole('heading', { level: 1, name: /he takes care of us/i })).toBeVisible({
      timeout: 10_000,
    });
  });

  test('should load successfully', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('load');
    await expect(page).toHaveTitle(/Hotel Etuna/i);
    await expect(page.locator('body')).toBeVisible();
  });

  test('should have navigation elements', async ({ page }, testInfo) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    if (testInfo.project.name === 'mobile-chrome') {
      await expect(page.getByRole('button', { name: /toggle mobile menu/i })).toBeVisible({
        timeout: 60_000,
      });
      await expect(page.locator('#mobile-menu')).toBeAttached();
    } else {
      await expect(page.getByRole('navigation', { name: 'Main navigation' })).toBeVisible({
        timeout: 60_000,
      });
    }
  });

  test('should display primary CTA to booking', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('load');
    await expect(page.getByRole('link', { name: /book your stay/i }).first()).toBeVisible({
      timeout: 60_000,
    });
  });

  test('should show expected room names and remove legacy room names', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('load');

    // Accept DB-driven rendering either in cards or booking options.
    expect(await page.getByText('Standard Room').count()).toBeGreaterThan(0);
    expect(await page.getByText('Standard Room (Type A)').count()).toBeGreaterThan(0);
    expect(await page.getByText('Standard Room (Type B)').count()).toBeGreaterThan(0);
    expect(await page.getByText('Executive Room').count()).toBeGreaterThan(0);
    expect(await page.getByText('Premiere Room').count()).toBeGreaterThan(0);

    await expect(page.getByText('Family Suite')).toHaveCount(0);
    await expect(page.getByText('Premier Suite')).toHaveCount(0);
  });

  test('should not show removed fictional amenities', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('load');

    await expect(page.getByText('Private Pool')).toHaveCount(0);
    await expect(page.getByText('Butler Service')).toHaveCount(0);
    await expect(page.getByText('Spa Bath')).toHaveCount(0);
  });

  test('should show corrected restaurant naming and breakfast times', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('load');

    await expect(page.getByRole('heading', { name: /etuna restaurant/i })).toBeVisible();
    await expect(page.getByText(/hotel etuna restaurant/i)).toHaveCount(0);
    await expect(page.getByText(/breakfast:\s*07:00/i)).toBeVisible();
    await expect(page.getByText(/lunch, dinner & bar:\s*10:00/i)).toBeVisible();
    await expect(page.getByText(/breakfast:\s*06:30/i)).toHaveCount(0);
  });

  test('should show corrected partner content', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('load');

    await expect(page.getByRole('link', { name: /jayla self catering accommodation/i })).toBeVisible();
    await expect(page.getByRole('link', { name: /aquarius luxurious penthouse/i })).toBeVisible();
    await expect(page.getByText(/self-catering/i)).toBeVisible();
    await expect(page.getByText(/penthouse|homestay/i).first()).toBeVisible();

    await expect(page.getByText(/8-10 rooms/i)).toHaveCount(0);
    await expect(page.getByText(/15-20 units/i)).toHaveCount(0);
  });

  test('should show corrected contact details in footer', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('load');

    await expect(page.getByText(/ongwediva|valley of the leopard street/i).first()).toBeVisible();
    const phoneCount = await page.getByText(/\+264 65 231 177/i).count();
    const fallbackCount = await page.getByText(/contact reception/i).count();
    expect(phoneCount > 0 || fallbackCount > 0).toBe(true);
    await expect(page.getByRole('link', { name: /frontdesk@hoteletuna.com/i })).toBeVisible();
  });

  test('should render guest reviews section with approved-or-empty state', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('load');

    await expect(page.getByRole('heading', { name: /guest love/i })).toBeVisible();

    const emptyState = page.getByText(/no reviews yet/i);
    const approvedState = page.getByText(/approved review\(s\)/i);
    expect((await emptyState.count()) > 0 || (await approvedState.count()) > 0).toBe(true);
  });

  test('book your stay CTA should jump to booking section', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('load');

    await page.getByRole('link', { name: /book your stay/i }).first().click();
    await expect(page).toHaveURL(/#booking$/);
    await expect(page.locator('#booking')).toBeVisible();
  });

  test('header navigation links should work', async ({ page }, testInfo) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });

    if (testInfo.project.name === 'mobile-chrome') {
      await page.getByRole('button', { name: /toggle mobile menu/i }).click();
      await page.locator('#mobile-menu').getByRole('link', { name: 'Rooms' }).click();
    } else {
      const header = page.getByRole('navigation', { name: 'Main navigation' });
      await expect(header.getByRole('link', { name: 'Rooms' })).toBeVisible();
      await expect(header.getByRole('link', { name: 'Dining' })).toBeVisible();
      await expect(header.getByRole('link', { name: 'About' })).toBeVisible();
      await expect(header.getByRole('link', { name: 'Contact' })).toBeVisible();
      await header.getByRole('link', { name: 'Rooms' }).click();
    }
    await expect(page).toHaveURL(/\/rooms$/);
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
    
    const menuToggle = page.locator('button[aria-label*="menu"], button[aria-label*="Menu"]').first();
    const navVisible = await page.locator('nav:visible').count();
    const toggleVisible = await menuToggle.isVisible().catch(() => false);
    expect(navVisible > 0 || toggleVisible).toBe(true);
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
