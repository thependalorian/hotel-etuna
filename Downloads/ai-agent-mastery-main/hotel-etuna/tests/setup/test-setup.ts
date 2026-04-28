/**
 * Vitest Test Setup
 *
 * Purpose: Configure test environment and global test utilities (Drizzle, tenant context)
 * Location: tests/setup/test-setup.ts
 *
 * Requires: DATABASE_URL in environment when running tests that use the DB.
 * RLS: Test helpers run DB operations inside runWithTenantContext where tenant-scoped.
 */

import { beforeAll } from 'vitest';
import { expect } from 'vitest';
import { healthCheck } from '@/lib/db';

beforeAll(async () => {
  try {
    const ok = await healthCheck();
    if (!ok) throw new Error('Health check returned false');
    console.log('✅ Database connected for tests (Drizzle)');
  } catch (error) {
    console.error('❌ Failed to connect to database:', error);
    throw error;
  }
});

export { expect };
export { runWithTenantContext } from '@/lib/auth/tenant-context';
export { setTenantContext, clearTenantContext } from '@/lib/db';
