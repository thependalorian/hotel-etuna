/**
 * Resolve Hotel Etuna hub tenant id for guest accounts and public property scope.
 * Location: lib/utils/hub-tenant.ts
 */

import { db, tenants } from '@/lib/db';
import { eq } from 'drizzle-orm';

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function resolveHubTenantId(): Promise<string> {
  const fromEnv = process.env.HUB_TENANT_ID?.trim() ?? '';
  if (UUID_REGEX.test(fromEnv)) {
    return fromEnv;
  }

  const rows = await db
    .select({ id: tenants.id })
    .from(tenants)
    .where(eq(tenants.type, 'hub'))
    .limit(1);

  const id = rows[0]?.id;
  if (!id) {
    throw new Error('Hub tenant not found. Set HUB_TENANT_ID or seed hotel-etuna.');
  }
  return id;
}
