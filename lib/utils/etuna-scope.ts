/**
 * Hotel Etuna Scope Resolution Utilities
 * 
 * Purpose: Centralized scope resolution for the Hotel Etuna tenant and property.
 * Used across the application to consistently identify the primary operator tenant,
 * its main property, and to resolve staff access permissions to specific properties.
 * 
 * Location: /lib/utils/etuna-scope.ts
 * 
 * Integration Points:
 * - API routes requiring tenant/property context
 * - Dashboard widgets and reports
 * - Multi-tenant permission checks
 * - Property-specific data queries
 */

import { neon } from '@neondatabase/serverless';
import type { Tenant, Property } from '@/lib/db/schema';

const sql = neon(process.env.DATABASE_URL!);

// Extended type for Property with joined tenant relationship
type PropertyWithTenant = Property & {
  tenant: Tenant;
};

// Regex to validate UUID format
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Resolves the Hotel Etuna operator tenant ID.
 * Prioritizes environment variable if set to a valid UUID.
 * Otherwise, queries the first 'operator' type tenant from the database.
 * 
 * @returns Promise<string> - The tenant UUID
 * @throws Error if no operator tenant found
 */
export async function resolveEtunaTenantId(): Promise<string> {
  const configuredTenantId = process.env.ETUNA_TENANT_ID || '';

  // If environment variable is a valid UUID, use it directly
  if (UUID_REGEX.test(configuredTenantId)) {
    return configuredTenantId;
  }

  // Query for the first operator tenant (Hotel Etuna's main tenant)
  const result = await sql`
    SELECT id FROM tenants
    WHERE type = 'operator'::tenant_type
    ORDER BY created_at ASC
    LIMIT 1
  `;

  if (result.length === 0) {
    throw new Error(
      'No operator tenant found. Run seed script or set ETUNA_TENANT_ID.'
    );
  }

  return result[0].id as string;
}

/**
 * Resolves the Hotel Etuna property ID.
 * Prioritizes environment variable if set to a valid UUID.
 * Otherwise, queries for the property with slug 'hotel-etuna' under the operator tenant.
 * 
 * @returns Promise<string> - The property UUID
 * @throws Error if property not found
 */
export async function resolveEtunaPropertyId(): Promise<string> {
  const configuredPropertyId = process.env.ETUNA_PROPERTY_ID || '';

  // If environment variable is a valid UUID, use it directly
  if (UUID_REGEX.test(configuredPropertyId)) {
    return configuredPropertyId;
  }

  const tenantId = await resolveEtunaTenantId();

  // Query for the hotel-etuna property under the operator tenant
  const result = await sql`
    SELECT id FROM properties
    WHERE tenant_id = ${tenantId}::uuid 
      AND slug = 'hotel-etuna'
    LIMIT 1
  `;

  if (result.length === 0) {
    throw new Error(
      'Hotel Etuna property not found. Run seed script or set ETUNA_PROPERTY_ID.'
    );
  }

  return result[0].id as string;
}

/**
 * Resolves the full Hotel Etuna property record with its tenant information.
 * Returns the property object with nested tenant data.
 * 
 * @returns Promise<PropertyWithTenant> - The property object with tenant
 * @throws Error if property or tenant not found
 */
export async function resolveEtunaProperty(): Promise<PropertyWithTenant> {
  const propertyId = await resolveEtunaPropertyId();

  const result = await sql`
    SELECT 
      p.*,
      json_build_object(
        'id', t.id,
        'name', t.name,
        'type', t.type,
        'created_at', t.created_at,
        'updated_at', t.updated_at
      ) as tenant
    FROM properties p
    JOIN tenants t ON p.tenant_id = t.id
    WHERE p.id = ${propertyId}::uuid
    LIMIT 1
  `;

  if (result.length === 0) {
    throw new Error('Hotel Etuna property not found in database.');
  }

  return result[0] as PropertyWithTenant;
}

/**
 * Resolves the appropriate property ID for staff access control.
 * 
 * Logic:
 * 1. If queryPropertyId is provided and valid, verify staff has access to it
 * 2. If no queryPropertyId or staff doesn't have access, return their default property
 * 3. Staff property access is determined by tenant_id match for now
 *    (Future: property_staff or role-based access control)
 * 
 * @param sessionTenantId - The authenticated user's tenant ID
 * @param queryPropertyId - Optional property ID from query parameters
 * @returns Promise<string> - The resolved property UUID
 * @throws Error if staff has no property access
 */
export async function resolveStaffPropertyId(
  sessionTenantId: string,
  queryPropertyId?: string
): Promise<string> {
  // If no specific property requested, return Hotel Etuna default
  if (!queryPropertyId) {
    return resolveEtunaPropertyId();
  }

  // Validate queryPropertyId format
  if (!UUID_REGEX.test(queryPropertyId)) {
    return resolveEtunaPropertyId();
  }

  // Check if staff (via their tenant) has access to the requested property
  const result = await sql`
    SELECT id FROM properties
    WHERE id = ${queryPropertyId}::uuid
      AND tenant_id = ${sessionTenantId}::uuid
    LIMIT 1
  `;

  // If staff has access to requested property, return it
  if (result.length > 0) {
    return queryPropertyId;
  }

  // Otherwise, fall back to Hotel Etuna default property
  return resolveEtunaPropertyId();
}

/**
 * Resolves the complete Hotel Etuna scope: tenant and property objects with IDs.
 * Used for dashboard context, analytics, and scope-aware queries.
 * 
 * @returns Promise<{tenant, property, tenantId, propertyId}>
 * @throws Error if tenant or property cannot be resolved
 */
export async function resolveEtunaScope(): Promise<{
  tenant: Tenant;
  property: PropertyWithTenant;
  tenantId: string;
  propertyId: string;
}> {
  const property = await resolveEtunaProperty();
  const tenantId = await resolveEtunaTenantId();

  if (!property.tenant) {
    throw new Error('Property tenant relationship not loaded.');
  }

  return {
    tenant: property.tenant as Tenant,
    property,
    tenantId,
    propertyId: property.id,
  };
}

/**
 * Resolves public-facing Hotel Etuna property information.
 * Returns property, its tenant, and hub tenant (operator) for public pages.
 * 
 * Used for:
 * - Public property listings
 * - Booking flows
 * - Marketing pages
 * 
 * @returns Promise<{tenant, property, hubTenant}>
 * @throws Error if property or operator tenant not found
 */
export async function resolvePublicEtunaProperty(): Promise<{
  tenant: Tenant;
  property: PropertyWithTenant;
  hubTenant: Tenant;
}> {
  const property = await resolveEtunaProperty();
  const operatorTenantId = await resolveEtunaTenantId();

  if (!property.tenant) {
    throw new Error('Property tenant relationship not loaded.');
  }

  // Query operator tenant info
  const hubResult = await sql`
    SELECT * FROM tenants
    WHERE id = ${operatorTenantId}::uuid
    LIMIT 1
  `;

  if (hubResult.length === 0) {
    throw new Error('Operator hub tenant not found.');
  }

  return {
    tenant: property.tenant as Tenant,
    property,
    hubTenant: hubResult[0] as Tenant,
  };
}
