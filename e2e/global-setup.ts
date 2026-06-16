import { loadEnvFiles } from './helpers/load-env';

/**
 * Warm dev server before the full Playwright suite (health + home).
 */
export default async function globalSetup(): Promise<void> {
  loadEnvFiles();
  const baseURL = (process.env.PLAYWRIGHT_BASE_URL ?? 'http://127.0.0.1:3010').replace(/\/$/, '');

  const warm = async (path: string) => {
    try {
      const res = await fetch(`${baseURL}${path}`, { signal: AbortSignal.timeout(120_000) });
      if (!res.ok) {
        console.warn(`[global-setup] ${path} returned ${res.status}`);
      }
    } catch (error) {
      console.warn(`[global-setup] failed to warm ${path}:`, error);
    }
  };

  await warm('/api/health');
  await warm('/');
}
