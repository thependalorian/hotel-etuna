/**
 * Tenant Context for RLS
 *
 * Purpose: Set app.tenant_id (and legacy app.current_tenant_id) per request so Row-Level Security
 *          policies allow the correct tenant's data.
 * Location: /lib/auth/tenant-context.ts
 *
 * Use in API routes (via withApiAuth) and server components that use db.
 */

import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { setTenantContext, clearTenantContext } from '@/lib/db/connection';

/**
 * Run an async function with tenant context set for RLS.
 * Clears context in finally so the connection is not left with a stale tenant.
 */
export async function runWithTenantContext<T>(
  tenantId: string | undefined | null,
  fn: () => Promise<T>
): Promise<T> {
  if (!tenantId) {
    return fn();
  }
  try {
    await setTenantContext(tenantId);
    return await fn();
  } finally {
    try {
      await clearTenantContext();
    } catch {
      // Ignore clear errors (e.g. connection already closed)
    }
  }
}

/**
 * Get session and set RLS tenant context for server components.
 * Call this at the start of server components that use db so RLS sees the correct tenant.
 * Returns the session; if session has tenantId, tenant context is set for subsequent queries.
 */
export async function getSessionWithTenantContext() {
  const session = await getServerSession(authOptions);
  const tenantId = (session?.user as { tenantId?: string } | undefined)?.tenantId;
  if (tenantId) {
    await setTenantContext(tenantId);
  }
  return session;
}
