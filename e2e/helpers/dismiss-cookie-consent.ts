import type { Page } from '@playwright/test';

const STORAGE_KEY = 'hoteletuna_cookie_consent_v1';

/**
 * Dismiss cookie consent banner so toasts do not block pointer events in UI tests.
 */
export async function dismissCookies(page: Page): Promise<void> {
  await page.addInitScript((key) => {
    try {
      localStorage.setItem(
        key,
        JSON.stringify({ essential: true, analytics: false, at: new Date().toISOString() }),
      );
    } catch {
      // ignore
    }
  }, STORAGE_KEY);

  const acceptAll = page.getByRole('button', { name: /accept all/i });
  if (await acceptAll.isVisible().catch(() => false)) {
    await acceptAll.click();
  }
}
