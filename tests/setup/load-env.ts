/**
 * Load .env before any DB imports (so DATABASE_URL is set when connection.ts loads)
 * Location: tests/setup/load-env.ts
 */

import { readFileSync, existsSync } from 'fs';
import { resolve } from 'path';

const root = resolve(process.cwd());
for (const file of ['.env.local', '.env']) {
  const path = resolve(root, file);
  if (existsSync(path)) {
    const content = readFileSync(path, 'utf8');
    for (const line of content.split('\n')) {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith('#')) {
        const eq = trimmed.indexOf('=');
        if (eq > 0) {
          const key = trimmed.slice(0, eq).trim();
          const value = trimmed.slice(eq + 1).trim().replace(/^["']|["']$/g, '');
          if (!(key in process.env)) process.env[key] = value;
        }
      }
    }
  }
}

// Prefer an isolated DB for tests when provided.
if (process.env.TEST_DATABASE_URL) {
  process.env.DATABASE_URL = process.env.TEST_DATABASE_URL;
}
