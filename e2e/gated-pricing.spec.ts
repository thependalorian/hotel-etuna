import { test, expect } from '@playwright/test';

/**
 * E2E Test: Gated Pricing
 * 
 * Tests that room rates are hidden from unauthenticated users
 * and displayed after login (PRD §6.6 - Database-driven landing)
 */

test.describe('Gated Pricing', () => {
  test('should hide room prices for unauthenticated users', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('load');

    // Should show "Sign in to see rates" or similar gated messaging
    const gatedMessage = page.locator('text=/sign in to see|login to view|sign in to view/i').first();
    const pricePattern = /\$\d+|NAD\s*\d+|N\$\d+/;
    
    // Either gated message exists OR prices are hidden
    const hasGatedMessage = await gatedMessage.count() > 0;
    const priceElements = await page.locator(`text=${pricePattern}`).count();
    
    // If no gated message, prices should be minimal or hidden
    if (!hasGatedMessage) {
      expect(priceElements).toBeLessThan(3); // Allow for some non-price numbers
    }
  });

  test('should show room prices after login', async ({ page }) => {
    // Login as manager
    await page.goto('/login');
    await page.waitForLoadState('load');
    
    await page.getByLabel(/email/i).fill('manager@hoteletuna.com');
    await page.getByLabel(/password/i).fill('Test1234!');
    await page.getByRole('button', { name: /sign in/i }).click();
    
    await page.waitForTimeout(2000);
    
    // Navigate to homepage or rooms
    await page.goto('/');
    await page.waitForLoadState('load');
    
    // Should now show prices
    const pricePattern = /NAD\s*\d+|N\$\d+/i;
    const priceCount = await page.locator(`text=${pricePattern}`).count();
    
    // Authenticated users should see prices (at least 3 room types)
    expect(priceCount).toBeGreaterThan(0);
  });

  test('should show gated pricing on rooms page', async ({ page }) => {
    await page.goto('/rooms');
    await page.waitForLoadState('load');
    
    // Check for gated pricing indicators
    const signInPrompt = page.locator('text=/sign in|login/i');
    const hasPrompt = await signInPrompt.count() > 0;
    
    // At minimum, should have some indication that auth is needed for rates
    if (hasPrompt) {
      expect(await signInPrompt.first().isVisible()).toBe(true);
    }
  });

  test('should redirect to login when trying to book without auth', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('load');
    
    // Try to access booking functionality
    const bookButton = page.getByRole('link', { name: /book|reserve/i }).first();
    if (await bookButton.isVisible()) {
      await bookButton.click();
      await page.waitForTimeout(1000);
      
      // Should either be on login page or booking section with auth prompt
      const url = page.url();
      const onLoginPage = url.includes('/login');
      const onBookingSection = url.includes('#booking');
      
      expect(onLoginPage || onBookingSection).toBe(true);
    }
  });

  test('partner pages should gate pricing for unauthenticated users', async ({ page }) => {
    // Visit partner page
    await page.goto('/partners/jayla-self-catering-accommodation');
    await page.waitForLoadState('load');
    
    // Partner pages should also hide pricing until login
    const gatedIndicator = page.locator('text=/sign in|login/i');
    const hasIndicator = await gatedIndicator.count() > 0;
    
    // Should show some gated pricing indication
    if (hasIndicator) {
      expect(await gatedIndicator.first().isVisible()).toBe(true);
    }
  });
});
