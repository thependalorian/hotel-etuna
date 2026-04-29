import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    /** Smoke tests: `npm run test:smoke` uses `vitest.smoke.config.ts` (this exclude avoids double-running smoke on `npm test`). */
    exclude: [
      '**/node_modules/**',
      '**/dist/**',
      '.next/**',
      'tests/smoke/**',
      /** Playwright specs — run with `npm run test:e2e`, not Vitest */
      '**/e2e/**',
      /** LLM + SMTP integration — run manually: `vitest run tests/sofia/sofia-chat-comprehensive.test.ts` */
      '**/tests/sofia/sofia-chat-comprehensive.test.ts',
    ],
    setupFiles: ['./tests/setup/load-env.ts', './tests/setup/test-setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'tests/',
        '**/*.config.*',
        '**/dist/',
        '**/.next/',
        '**/prisma/',
      ],
    },
    testTimeout: 30000, // 30 seconds for database operations
    hookTimeout: 60000, // 60 seconds for setup/teardown
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './'),
    },
  },
});
