/**
 * @fileoverview Public hub property resolution for unauthenticated pages.
 * Location: lib/utils/public-property.ts
 */
import { and, asc, eq } from 'drizzle-orm';
import { db, properties, tenants } from '@/lib/db';

/**
 * Resolve the hub property used by public pages.
 *
 * Priority:
 * 1) Env `DEFAULT_PROPERTY_ID`
 * 2) Hub tenant's `hotel-etuna` slug property
 * 3) First active property for hub tenant
 */
export async function resolvePublicHubProperty() {
  const hubTenantId = process.env.HUB_TENANT_ID?.trim();
  const defaultPropertyId = process.env.DEFAULT_PROPERTY_ID?.trim();

  if (!hubTenantId) {
    throw new Error('Missing HUB_TENANT_ID');
  }

  const [hubTenant] = await db
    .select({ id: tenants.id, name: tenants.name })
    .from(tenants)
    .where(eq(tenants.id, hubTenantId))
    .limit(1);

  if (!hubTenant) {
    throw new Error(`Hub tenant not found for HUB_TENANT_ID=${hubTenantId}`);
  }

  if (defaultPropertyId) {
    const [envProperty] = await db
      .select()
      .from(properties)
      .where(and(eq(properties.id, defaultPropertyId), eq(properties.tenantId, hubTenant.id)))
      .limit(1);
    if (envProperty) {
      return { hubTenant, property: envProperty };
    }
  }

  const [slugProperty] = await db
    .select()
    .from(properties)
    .where(and(eq(properties.tenantId, hubTenant.id), eq(properties.slug, 'hotel-etuna')))
    .limit(1);
  if (slugProperty) {
    return { hubTenant, property: slugProperty };
  }

  const [firstProperty] = await db
    .select()
    .from(properties)
    .where(eq(properties.tenantId, hubTenant.id))
    .orderBy(asc(properties.createdAt))
    .limit(1);

  if (!firstProperty) {
    throw new Error(`No properties found for hub tenant ${hubTenant.id}`);
  }

  return { hubTenant, property: firstProperty };
}
