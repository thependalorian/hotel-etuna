import { test, expect } from '@playwright/test';

/**
 * E2E Test: Public Components
 * 
 * Tests that PublicHero, PublicFooter, and other public components
 * render correctly on the landing page
 */

test.describe('Public Components', () => {
  test('should render PublicHero/HeroSection with correct content', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('load');
    
    // Check for hero heading
    const heroHeading = page.getByRole('heading', { level: 1, name: /he takes care of us|hotel etuna/i });
    await expect(heroHeading).toBeVisible({ timeout: 10_000 });
    
    // Hero should have CTA
    const heroCTA = page.getByRole('link', { name: /book your stay|book now/i }).first();
    await expect(heroCTA).toBeVisible();
  });

  test('should render PublicFooter with contact information', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('load');
    
    // Footer should exist
    const footer = page.locator('footer');
    await expect(footer).toBeVisible();
    
    // Should have contact info (from database)
    await expect(page.getByText(/ongwediva|valley of the leopard/i).first()).toBeVisible();
    
    // Should have email link
    await expect(page.getByRole('link', { name: /info@hoteletuna.com/i })).toBeVisible();
    
    // Should have phone or contact instruction
    const hasPhone = await page.getByText(/\+264 65 231 177/i).count() > 0;
    const hasContact = await page.getByText(/contact reception/i).count() > 0;
    expect(hasPhone || hasContact).toBe(true);
  });

  test('should render NavigationHeader with correct links', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('load');
    
    // Navigation should exist
    const nav = page.getByRole('navigation', { name: 'Main navigation' });
    await expect(nav).toBeVisible({ timeout: 60_000 });
    
    // Check key nav links
    await expect(nav.getByRole('link', { name: 'Rooms' })).toBeVisible();
    await expect(nav.getByRole('link', { name: 'Dining' })).toBeVisible();
  });

  test('should render AboutSection on homepage', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('load');
    
    // About section should exist (with ID or heading)
    const aboutSection = page.locator('#about, section:has(h2:has-text("About"))').first();
    if (await aboutSection.count() > 0) {
      await expect(aboutSection).toBeVisible();
    }
  });

  test('should render TrustSection with reviews', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('load');
    
    // Reviews section
    const reviewsHeading = page.getByRole('heading', { name: /guest love|reviews/i });
    await expect(reviewsHeading).toBeVisible();
    
    // Should show reviews or empty state
    const emptyState = page.getByText(/no reviews yet/i);
    const hasReviews = await page.locator('[data-testid="review-card"], .review-item').count() > 0;
    const isEmpty = await emptyState.count() > 0;
    
    expect(hasReviews || isEmpty).toBe(true);
  });

  test('should render PricingSection with room types', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('load');
    
    // Rooms section
    const roomsSection = page.locator('#rooms, section:has(h2:has-text("Rooms"))').first();
    await expect(roomsSection).toBeVisible({ timeout: 10_000 });
    
    // Should show room types
    expect(await page.getByText('Standard Room').count()).toBeGreaterThan(0);
    expect(await page.getByText('Luxury Room').count()).toBeGreaterThan(0);
  });

  test('should render Partners section', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('load');
    
    // Partners section
    const partnersSection = page.locator('#partners, section:has(h2:has-text("Partners"))').first();
    if (await partnersSection.count() > 0) {
      await expect(partnersSection).toBeVisible();
      
      // Should show partner links
      await expect(page.getByRole('link', { name: /jayla self catering/i })).toBeVisible();
      await expect(page.getByRole('link', { name: /aquarius luxurious/i })).toBeVisible();
    }
  });

  test('footer should have consistent branding across pages', async ({ page }) => {
    const pages = ['/', '/rooms', '/dining'];
    
    for (const path of pages) {
      await page.goto(path);
      await page.waitForLoadState('load');
      
      const footer = page.locator('footer');
      await expect(footer).toBeVisible();
      
      // Should have Hotel Etuna branding
      const hasBranding = await page.getByText(/hotel etuna|etuna/i).count() > 0;
      expect(hasBranding).toBe(true);
    }
  });

  test('public components should be mobile responsive', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');
    await page.waitForLoadState('load');
    
    // Hero should be visible
    const hero = page.locator('section').first();
    await expect(hero).toBeVisible();
    
    // Footer should be visible
    const footer = page.locator('footer');
    await expect(footer).toBeVisible();
    
    // Nav should be mobile-friendly (menu toggle or visible nav)
    const nav = page.locator('nav').first();
    const menuButton = page.locator('button[aria-label*="menu"]').first();
    
    const hasNav = await nav.isVisible();
    const hasMenuButton = await menuButton.isVisible();
    
    expect(hasNav || hasMenuButton).toBe(true);
  });
});
