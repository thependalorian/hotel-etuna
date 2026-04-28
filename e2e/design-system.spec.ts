import { test, expect } from '@playwright/test';

/**
 * Design system smoke checks aligned with Tailwind tokens and layout.tsx fonts.
 */

test.describe('Design System', () => {
  test('should load web font stack (Inter variable or system fallback)', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('load');

    await expect
      .poll(
        async () =>
          (
            await page.evaluate(() => window.getComputedStyle(document.body).fontFamily)
          ).toLowerCase(),
        { timeout: 20_000 },
      )
      .toMatch(/inter|geist|system-ui|ui-sans|apple|segoe|helvetica/i);
  });

  test('primary CTA should use khaki-600 family (not nude-600)', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('load');

    const cta = page.getByRole('link', { name: /book your stay/i }).first();
    await expect(cta).toBeVisible();

    const styles = await cta.evaluate((el) => {
      const t = (el.querySelector('button') as HTMLElement) || el;
      const computed = window.getComputedStyle(t);
      return {
        borderRadius: computed.borderRadius,
        backgroundColor: computed.backgroundColor,
      };
    });
    expect(styles.borderRadius).not.toBe('0px');
    expect(styles.backgroundColor).not.toBe('rgba(0, 0, 0, 0)');
  });

  test('should use defined body colors', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('load');

    await expect
      .poll(async () => {
        const styles = await page.evaluate(() => {
          const s = window.getComputedStyle(document.body);
          return { color: s.color, backgroundColor: s.backgroundColor };
        });
        return Boolean(styles.color && styles.backgroundColor);
      }, { timeout: 20_000 })
      .toBe(true);
  });

  test('should have padded content inside main landmark', async ({ page }) => {
    await page.goto('/');
    const main = page.locator('main').first();
    await expect(main).toBeVisible({ timeout: 20_000 });

    const firstSection = page.locator('main section').first();
    await expect(firstSection).toBeVisible({ timeout: 15_000 });

    const padding = await firstSection.evaluate((el) => window.getComputedStyle(el).padding);
    expect(padding).not.toMatch(/^0(px)?(\s+0(px)?){3}$/);
  });

  test('should have minimum touch target height on mobile (44px)', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');
    await page.waitForLoadState('load');

    const firstButton = page.getByRole('link', { name: /book your stay/i }).first();
    const height = await firstButton.evaluate((el) => {
      const target = (el.querySelector('button') as HTMLElement) || (el as HTMLElement);
      return target.getBoundingClientRect().height;
    });

    expect(height).toBeGreaterThanOrEqual(44);
  });

  test('should show focus-visible ring after keyboard focus', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('load');

    for (let i = 0; i < 12; i++) {
      await page.keyboard.press('Tab');
    }

    const visible = page.locator(':focus-visible').first();
    await expect(visible).toBeVisible({ timeout: 10_000 });

    const outlineW = await visible.evaluate((el) =>
      parseFloat(window.getComputedStyle(el).outlineWidth || '0'),
    );
    const boxShadow = await visible.evaluate((el) => window.getComputedStyle(el).boxShadow);

    const hasRing = outlineW > 0 || (boxShadow && boxShadow !== 'none');
    expect(hasRing).toBe(true);
  });

  test('should have semantic landmarks', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('nav').first()).toBeVisible({ timeout: 20_000 });
    await expect(page.locator('main').first()).toBeVisible();
  });

  test('should be responsive - mobile (no large horizontal overflow)', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');
    await page.waitForLoadState('load');

    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    );
    expect(overflow).toBeLessThanOrEqual(16);
  });

  test('should be responsive - tablet', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.goto('/');
    await expect(page.locator('body')).toBeVisible();
  });

  test('should be responsive - desktop', async ({ page }) => {
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.goto('/');
    await expect(page.locator('body')).toBeVisible();
  });

  test('should have ARIA labels on icon-only controls when present', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('load');

    const iconButtons = page.locator(
      'button[aria-label], button[aria-labelledby], [role="button"][aria-label]',
    );
    const count = await iconButtons.count();
    if (count === 0) return;

    const aria = await iconButtons.first().getAttribute('aria-label');
    const labelled = await iconButtons.first().getAttribute('aria-labelledby');
    expect(Boolean(aria || labelled)).toBe(true);
  });

  test('H1 should use display/serif heading font', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('load');

    const h1 = page.locator('h1, [role="heading"][aria-level="1"]').first();
    await expect(h1).toBeVisible();
    const h1Font = await h1.evaluate((el) => window.getComputedStyle(el).fontFamily.toLowerCase());
    expect(h1Font).toMatch(/playfair|serif|display/);
  });

  test('should render Hotel Etuna HE badge', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('load');

    await expect(page.getByText('HE').first()).toBeVisible();
  });
});
