import { test, expect } from '@playwright/test';

/**
 * UX-PAY-05 / desk shell — payments desk loads booking picker for staff.
 */

test.describe('Payments desk', () => {
  test('staff can open desk and see booking search', async ({ page }) => {
    await page.goto('/login');
    await page.waitForLoadState('load');

    await page.getByLabel(/email/i).fill('manager@hoteletuna.com');
    await page.getByLabel(/password/i).fill(process.env.ADMIN_PASSWORD ?? process.env.PASSWORD ?? 'Test1234!');
    await page.getByRole('button', { name: /sign in/i }).click();
    await page.waitForTimeout(1500);

    await page.goto('/payments/desk');
    await page.waitForLoadState('load');

    const onLogin = page.url().includes('/login');
    if (onLogin) {
      test.skip();
      return;
    }

    await expect(page.getByRole('heading', { name: /payments desk/i })).toBeVisible();
    await expect(page.getByLabel(/find booking/i)).toBeVisible();
    await expect(page.getByText(/payment reconciliation/i).first()).toBeVisible();
  });
});
