import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

/**
 * Load `.env.local` / `.env` into `process.env` (first win) for E2E DB helpers.
 * Matches `scripts/smoke-user-journeys.ts` and `scripts/verify-db.ts`.
 */
export function loadEnvFiles(): void {
  const root = resolve(process.cwd());
  for (const file of ['.env.local', '.env']) {
    const p = resolve(root, file);
    if (!existsSync(p)) continue;
    for (const line of readFileSync(p, 'utf8').split('\n')) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const eq = trimmed.indexOf('=');
      if (eq <= 0) continue;
      const key = trimmed.slice(0, eq).trim();
      const value = trimmed.slice(eq + 1).trim().replace(/^["']|["']$/g, '');
      if (!(key in process.env)) process.env[key] = value;
    }
  }
}
