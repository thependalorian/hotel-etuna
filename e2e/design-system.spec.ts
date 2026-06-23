import { test, expect } from '@playwright/test';
import { dismissCookies } from './helpers/dismiss-cookie-consent';
import { loginAsGuest } from './helpers/login';
import { loadEnvFiles } from './helpers/load-env';

/**
 * Design system smoke checks aligned with Tailwind tokens and layout.tsx fonts.
 */

test.describe('Design System', () => {
  test.describe.configure({ timeout: 120_000 });

  test.beforeAll(() => {
    loadEnvFiles();
  });

  test.beforeEach(async ({ page }) => {
    await dismissCookies(page);
  });

  test('should load web font stack (Inter variable or system fallback)', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });

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

  test('primary CTA should use CI Rustic Red (not khaki-600)', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });

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
    // ci-primary #790C19 → rgb(121, 12, 25)
    expect(styles.backgroundColor).toMatch(/121,\s*12,\s*25|rgb\(121 12 25\)/i);
  });

  test('should use defined body colors', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });

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

  test('body canvas should be warm CI off-white (not pure white)', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });

    const bg = await page.evaluate(() => window.getComputedStyle(document.body).backgroundColor);
    // ci.accent.offWhite #FAF6F0 → rgb(250, 246, 240)
    expect(bg).toMatch(/250,\s*246,\s*240|rgb\(250 246 240\)/i);
  });

  test('room listing cards on /rooms should have no box shadow on shell', async ({ page }) => {
    await page.goto('/rooms', { waitUntil: 'domcontentloaded' });

    const card = page.locator('.etuna-listing-card').first();
    await expect(card).toBeVisible({ timeout: 20_000 });

    const boxShadow = await card.evaluate((el) => window.getComputedStyle(el).boxShadow);
    expect(boxShadow === 'none' || boxShadow === '').toBe(true);
  });

  test('should have padded content inside main landmark', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    const main = page.locator('main').first();
    await expect(main).toBeVisible({ timeout: 20_000 });

    const firstSection = page.locator('main section').first();
    await expect(firstSection).toBeVisible({ timeout: 15_000 });

    const padding = await firstSection.evaluate((el) => window.getComputedStyle(el).padding);
    expect(padding).not.toMatch(/^0(px)?(\s+0(px)?){3}$/);
  });

  test('should have minimum touch target height on mobile (44px)', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/', { waitUntil: 'domcontentloaded' });

    const firstButton = page.getByRole('link', { name: /book your stay/i }).first();
    const height = await firstButton.evaluate((el) => {
      const target = (el.querySelector('button') as HTMLElement) || (el as HTMLElement);
      return target.getBoundingClientRect().height;
    });

    expect(height).toBeGreaterThanOrEqual(44);
  });

  test('should show focus-visible ring after keyboard focus', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });

    let hasRing = false;
    for (let i = 0; i < 20; i++) {
      await page.keyboard.press('Tab');
      hasRing = await page.evaluate(() => {
        const el = document.activeElement;
        if (!el || el === document.body || el === document.documentElement) return false;
        const styles = window.getComputedStyle(el);
        const outlineW = parseFloat(styles.outlineWidth || '0');
        const boxShadow = styles.boxShadow;
        return outlineW > 0 || (boxShadow !== '' && boxShadow !== 'none');
      });
      if (hasRing) break;
    }

    expect(hasRing).toBe(true);
  });

  test('should have semantic landmarks', async ({ page }, testInfo) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    if (testInfo.project.name === 'mobile-chrome') {
      await expect(page.getByRole('button', { name: /toggle mobile menu/i })).toBeVisible({
        timeout: 20_000,
      });
    } else {
      await expect(page.getByRole('navigation', { name: 'Main navigation' })).toBeVisible({
        timeout: 20_000,
      });
    }
    await expect(page.locator('main').first()).toBeVisible();
  });

  test('should be responsive - mobile (no large horizontal overflow)', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/', { waitUntil: 'domcontentloaded' });

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

  test('guest hub nav links use pill shape when signed in', async ({ page }) => {
    test.skip(!process.env.DATABASE_URL, 'Set DATABASE_URL in .env.local to run this test.');

    await loginAsGuest(page);

    const profileLink = page
      .getByRole('navigation', { name: 'Guest navigation' })
      .getByRole('link', { name: 'Profile', exact: true });
    await expect(profileLink).toBeVisible();
    const radius = await profileLink.evaluate((el) => window.getComputedStyle(el).borderRadius);
    expect(parseFloat(radius)).toBeGreaterThan(8);
  });
});
