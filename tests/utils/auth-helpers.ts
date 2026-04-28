/**
 * Authentication Test Helpers
 *
 * Purpose: Utilities for testing authentication and authorization (Drizzle, RLS-aware)
 * Location: tests/utils/auth-helpers.ts
 */

import { db } from '@/lib/db';
import { sql } from 'drizzle-orm';
import { runWithTenantContext } from '@/lib/auth/tenant-context';
import { createTestUser, createTestTenant } from './test-helpers';
import bcrypt from 'bcryptjs';

/**
 * Create a mock session for testing (runs with tenant context for RLS)
 */
export async function createMockSession(tenantId: string, userId: string) {
  return runWithTenantContext(tenantId, async () => {
    const rows = await db.execute(sql`
      SELECT
        u.id,
        u.email,
        u.first_name,
        u.last_name,
        u.role,
        u.tenant_id,
        t.id as tenant_row_id,
        t.name as tenant_name
      FROM users u
      LEFT JOIN tenants t ON t.id = u.tenant_id
      WHERE u.id = ${userId}
      LIMIT 1
    `);
    const user = rows.rows[0] as Record<string, unknown> | undefined;
    if (!user) throw new Error('User not found');
    const firstName = (user.first_name as string) ?? '';
    const lastName = (user.last_name as string) ?? '';
  const fullName = [firstName, lastName].filter(Boolean).join(' ') || '';

    return {
      user: {
        id: user.id as string,
        email: user.email as string,
        firstName,
        lastName,
        fullName,
        role: user.role as string,
        tenantId: user.tenant_id as string,
        tenant: user.tenant_row_id
          ? {
              id: user.tenant_row_id as string,
              name: user.tenant_name as string,
            }
          : null,
      },
      expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    };
  });
}

/**
 * Create authenticated test context
 */
export async function createAuthenticatedContext() {
  const tenant = await createTestTenant();
  const user = await createTestUser(tenant.id);
  const session = await createMockSession(tenant.id, user.id);

  return {
    tenant,
    user,
    session,
    cleanup: async () => {},
  };
}

/**
 * Verify password hash
 */
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return await bcrypt.compare(password, hash);
}
