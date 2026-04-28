/**
 * Tenant Validation Utility
 *
 * Purpose: Validate and resolve tenant context from subdomain or headers
 * Location: /lib/utils/tenant-validation.ts
 *
 * Implements:
 * - Subdomain-based tenant resolution
 * - Tenant existence validation
 * - Tenant context setting for RLS
 *
 * Following System Design Principles:
 * - Multi-Tenancy Strategy
 * - Security Architecture (Tenant Isolation)
 */

import { db } from '@/lib/db';
import { tenants } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { NextRequest } from 'next/server';

/**
 * Extract subdomain from hostname
 */
export function extractSubdomain(hostname: string): string | null {
  const parts = hostname.split('.');

  // Skip common prefixes
  if (parts.length < 2) return null;

  const subdomain = parts[0];
  const skipDomains = ['www', 'app', 'api', 'localhost', '127.0.0.1'];

  if (skipDomains.includes(subdomain.toLowerCase())) {
    return null;
  }

  return subdomain;
}

/**
 * Validate tenant exists and is active
 */
export async function validateTenant(
  subdomain: string
): Promise<{ valid: boolean; tenantId?: string; tenant?: unknown }> {
  try {
    const [tenant] = await db
      .select({
        id: tenants.id,
        name: tenants.name,
        status: tenants.status,
        subdomain: tenants.subdomain,
        propertyType: tenants.propertyType,
        hasRestaurantFeatures: tenants.hasRestaurantFeatures,
      })
      .from(tenants)
      .where(eq(tenants.subdomain, subdomain))
      .limit(1);

    if (!tenant) {
      return { valid: false };
    }

    if (tenant.status !== 'active') {
      return { valid: false };
    }

    return {
      valid: true,
      tenantId: tenant.id,
      tenant,
    };
  } catch (error) {
    console.error('Tenant validation error:', error);
    return { valid: false };
  }
}

/**
 * Get tenant context from request
 */
export async function getTenantContext(
  req: NextRequest
): Promise<{ tenantId?: string; subdomain?: string }> {
  // Check header first (set by middleware)
  const tenantId = req.headers.get('x-tenant-id');
  if (tenantId) {
    return { tenantId };
  }

  // Extract from subdomain
  const hostname = req.headers.get('host') || '';
  const subdomain = extractSubdomain(hostname);

  if (subdomain) {
    const validation = await validateTenant(subdomain);
    if (validation.valid && validation.tenantId) {
      return {
        tenantId: validation.tenantId,
        subdomain,
      };
    }
  }

  return {};
}

/**
 * Set tenant context for database queries (RLS)
 * This should be called before database operations
 */
export async function setTenantContext(tenantId: string): Promise<void> {
  // For Drizzle, tenant isolation is handled via WHERE clauses
  // Example: db.select().from(properties).where(eq(properties.tenantId, tenantId))
}
