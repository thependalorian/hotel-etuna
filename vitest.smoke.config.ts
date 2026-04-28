import { defineConfig } from 'vitest/config';
import path from 'path';

/**
 * Smoke-only Vitest config (DB-heavy compliance/fraud checks).
 * Default vitest.config.ts excludes tests/smoke/** so the main suite stays stable.
 */
export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['tests/smoke/**/*.{test,spec}.?(c|m)[jt]s?(x)'],
    exclude: ['**/node_modules/**', '**/dist/**', '.next/**'],
    setupFiles: ['./tests/setup/load-env.ts', './tests/setup/test-setup.ts'],
    testTimeout: 30000,
    hookTimeout: 60000,
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './'),
    },
  },
});
