/**
 * Platform Tenants API Route
 * 
 * Purpose: API endpoint for platform admin tenant management
 * Location: app/api/admin/platform/tenants/route.ts
 * 
 * Features:
 * - GET: List all tenants (platform admin)
 * - POST: Create new tenant
 */

import { NextRequest, NextResponse } from 'next/server';
import { withPlatformAdminAuth } from '@/lib/auth/with-platform-admin-auth';
import { db, tenants } from '@/lib/db';
import { desc, eq, sql } from 'drizzle-orm';
import { securityLogger } from '@/lib/utils/security-logger';

// GET - List all tenants
export async function GET(request: NextRequest) {
  return withPlatformAdminAuth(request, async () => {
  try {
    // Fetch partner tenants only (hub is fixed for Hotel Etuna)
    const allTenants = await db
      .select()
      .from(tenants)
      .where(eq(tenants.type, 'partner'))
      .orderBy(desc(tenants.createdAt));

    return NextResponse.json({ data: allTenants });
  } catch (error) {
    securityLogger.error('Error fetching tenants:', error);
    return NextResponse.json(
      { error: 'Failed to fetch tenants' },
      { status: 500 }
    );
  }
  });
}

// POST - Create new tenant
export async function POST(request: NextRequest) {
  return withPlatformAdminAuth(
    request,
    async (req) => {
  try {
    const body = await req!.json();
    const { name, subdomain, domain, property_type, room_count, has_restaurant_features, parent_tenant_id, commission_percent } = body;

    if (!name) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 });
    }

    // Generate subdomain if not provided
    const tenantSubdomain = subdomain || name.toLowerCase().replace(/\s+/g, '-');

    // Create tenant (Drizzle schema: propertyType, roomCount, hasRestaurantFeatures)
    const [newTenant] = await db
      .insert(tenants)
      .values({
        name,
        type: 'partner',
        parentTenantId: parent_tenant_id ?? process.env.HUB_TENANT_ID ?? null,
        commissionPercent: commission_percent != null ? String(commission_percent) : null,
        subdomain: tenantSubdomain,
        domain: domain || null,
        propertyType: property_type || 'hotel',
        roomCount: room_count ?? 0,
        hasRestaurantFeatures: has_restaurant_features ?? false,
        status: 'active',
      })
      .returning();

    return NextResponse.json({ data: newTenant }, { status: 201 });
  } catch (error) {
    securityLogger.error('Error creating tenant:', error);
    return NextResponse.json(
      { error: 'Failed to create tenant' },
      { status: 500 }
    );
  }
    },
    { superAdmin: true }
  );
}
