import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright E2E — etuna-host (local browser journeys).
 * Base URL: PLAYWRIGHT_BASE_URL or http://127.0.0.1:3010
 *
 * Skip auto-start of Next when you already run dev elsewhere:
 *   PLAYWRIGHT_SKIP_WEBSERVER=1 npm run test:e2e
 *
 * Viewports: desktop (chromium), mobile (Pixel 5), tablet (iPad).
 */
const baseURL = (process.env.PLAYWRIGHT_BASE_URL ?? 'http://127.0.0.1:3010').replace(/\/$/, '');
const skipWebServer = process.env.PLAYWRIGHT_SKIP_WEBSERVER === '1';
const useDefaultOrigin = !process.env.PLAYWRIGHT_BASE_URL;

export default defineConfig({
  testDir: './e2e',
  globalSetup: './e2e/global-setup.ts',
  timeout: 120_000,
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 1,
  // Serial locally avoids overwhelming webpack/turbo first-compile on a single dev server.
  workers: process.env.CI ? 2 : 1,
  reporter: [['list'], ['html', { open: 'never' }]],
  expect: {
    timeout: 15_000,
  },
  use: {
    baseURL,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    navigationTimeout: 90_000,
    actionTimeout: 90_000,
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'mobile-chrome',
      use: { ...devices['Pixel 5'] },
    },
    {
      name: 'tablet',
      use: { ...devices['iPad (gen 7)'] },
    },
  ],
  webServer:
    skipWebServer || !useDefaultOrigin
      ? undefined
      : {
          command: 'npx next dev --turbo -p 3010',
          url: 'http://127.0.0.1:3010/api/health',
          reuseExistingServer: process.env.PLAYWRIGHT_REUSE_SERVER === '1',
          timeout: 300_000,
          env: {
            ...process.env,
            E2E_TURNSTILE_BYPASS: '1',
          },
        },
});
