import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright E2E — buffr-host (local browser journeys).
 * Base URL: PLAYWRIGHT_BASE_URL or http://127.0.0.1:3010
 *
 * Skip auto-start of Next when you already run dev elsewhere:
 *   PLAYWRIGHT_SKIP_WEBSERVER=1 npm run test:e2e
 */
const baseURL = (process.env.PLAYWRIGHT_BASE_URL ?? 'http://127.0.0.1:3010').replace(/\/$/, '');
const skipWebServer = process.env.PLAYWRIGHT_SKIP_WEBSERVER === '1';
/** Only auto-start Next when using default URL so port matches `npm run dev -- -p 3010`. */
const useDefaultOrigin = !process.env.PLAYWRIGHT_BASE_URL;

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 2 : 3,
  reporter: [['list'], ['html', { open: 'never' }]],
  use: {
    baseURL,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    navigationTimeout: 90_000,
    actionTimeout: 30_000,
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer:
    skipWebServer || !useDefaultOrigin
      ? undefined
      : {
          command: 'npm run dev -- -p 3010',
          url: 'http://127.0.0.1:3010/register',
          reuseExistingServer: true,
          timeout: 180_000,
        },
});
