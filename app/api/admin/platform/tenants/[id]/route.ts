/**
 * Platform Tenant API Route (Dynamic)
 * 
 * Purpose: API endpoint for individual tenant operations
 * Location: app/api/admin/platform/tenants/[id]/route.ts
 * 
 * Features:
 * - GET: Get tenant details
 * - PATCH: Update tenant
 * - DELETE: Delete tenant
 */

import { NextRequest, NextResponse } from 'next/server';
import { withPlatformAdminAuth } from '@/lib/auth/with-platform-admin-auth';
import { db, tenants } from '@/lib/db';
import { eq } from 'drizzle-orm';
import { securityLogger } from '@/lib/utils/security-logger';

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET - Get tenant details
export async function GET(request: NextRequest, { params }: RouteParams) {
  return withPlatformAdminAuth(request, async () => {
  try {
    const { id } = await params;

    const [tenant] = await db
      .select()
      .from(tenants)
      .where(eq(tenants.id, id))
      .limit(1);

    if (!tenant) {
      return NextResponse.json({ error: 'Tenant not found' }, { status: 404 });
    }
    if (tenant.type !== 'partner') {
      return NextResponse.json({ error: 'Hub tenant is not editable here' }, { status: 403 });
    }

    return NextResponse.json({ data: tenant });
  } catch (error) {
    securityLogger.error('Error fetching tenant:', error);
    return NextResponse.json(
      { error: 'Failed to fetch tenant' },
      { status: 500 }
    );
  }
  });
}

// PATCH - Update tenant
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  return withPlatformAdminAuth(
    request,
    async (req) => {
  try {
    const { id } = await params;
    const body = await req!.json();
    const { name, subdomain, domain, property_type, room_count, has_restaurant_features, status } = body;

    // Check if tenant exists
    const [existingTenant] = await db
      .select()
      .from(tenants)
      .where(eq(tenants.id, id))
      .limit(1);

    if (!existingTenant) {
      return NextResponse.json({ error: 'Tenant not found' }, { status: 404 });
    }
    if (existingTenant.type !== 'partner') {
      return NextResponse.json({ error: 'Hub tenant is not editable here' }, { status: 403 });
    }

    // Update tenant (Drizzle schema: propertyType, roomCount, hasRestaurantFeatures, updatedAt)
    const [updatedTenant] = await db
      .update(tenants)
      .set({
        name: name || existingTenant.name,
        subdomain: subdomain !== undefined ? subdomain : existingTenant.subdomain,
        domain: domain !== undefined ? domain : existingTenant.domain,
        propertyType: property_type ?? existingTenant.propertyType,
        roomCount: room_count !== undefined ? room_count : existingTenant.roomCount,
        hasRestaurantFeatures: has_restaurant_features !== undefined ? has_restaurant_features : existingTenant.hasRestaurantFeatures,
        status: status || existingTenant.status,
        updatedAt: new Date(),
      })
      .where(eq(tenants.id, id))
      .returning();

    return NextResponse.json({ data: updatedTenant });
  } catch (error) {
    securityLogger.error('Error updating tenant:', error);
    return NextResponse.json(
      { error: 'Failed to update tenant' },
      { status: 500 }
    );
  }
    },
    { superAdmin: true }
  );
}

// DELETE - Delete tenant
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  return withPlatformAdminAuth(
    request,
    async () => {
  try {
    const { id } = await params;

    // Check if tenant exists
    const [existingTenant] = await db
      .select()
      .from(tenants)
      .where(eq(tenants.id, id))
      .limit(1);

    if (!existingTenant) {
      return NextResponse.json({ error: 'Tenant not found' }, { status: 404 });
    }
    if (existingTenant.type !== 'partner') {
      return NextResponse.json({ error: 'Hub tenant cannot be deleted' }, { status: 403 });
    }

    // Delete tenant (cascades to related records due to foreign key constraints)
    await db
      .delete(tenants)
      .where(eq(tenants.id, id));

    return NextResponse.json({ message: 'Tenant deleted successfully' });
  } catch (error) {
    securityLogger.error('Error deleting tenant:', error);
    return NextResponse.json(
      { error: 'Failed to delete tenant' },
      { status: 500 }
    );
  }
    },
    { superAdmin: true }
  );
}
