/**
 * Property Management Page
 * 
 * Purpose: Platform admin page for managing all properties across tenants
 * Location: app/(dashboard)/admin/platform/properties/page.tsx
 * 
 * Database: Uses Drizzle ORM with Neon PostgreSQL
 */

import React from 'react';
import { getCurrentPlatformAdmin } from '@/lib/auth/platform-admin';
import PropertyList from '@/components/features/admin/platform/PropertyList';
import { db, properties, tenants, rooms } from '@/lib/db';
import { desc, eq, sql } from 'drizzle-orm';

interface PropertyWithCounts {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  address: string | null;
  city: string | null;
  country: string | null;
  property_type: string | null;
  bedrooms: number;
  bathrooms: number;
  max_guests: number;
  base_price: number | null;
  status: string;
  is_featured: boolean;
  tenant_id: string;
  created_at: string;
  tenant_name: string | null;
  room_count: number;
}

export default async function PropertiesPage() {
  const user = await getCurrentPlatformAdmin();
  
  if (!user) {
    return null; // Layout will handle redirect
  }

  // Fetch all properties with tenant info (schema: type, roomCount, createdAt)
  const allProperties = await db
    .select({
      id: properties.id,
      name: properties.name,
      slug: properties.slug,
      description: properties.description,
      address: properties.address,
      city: properties.city,
      country: properties.country,
      type: properties.type,
      roomCount: properties.roomCount,
      status: properties.status,
      tenantId: properties.tenantId,
      createdAt: properties.createdAt,
      tenant_name: tenants.name,
    })
    .from(properties)
    .leftJoin(tenants, eq(properties.tenantId, tenants.id))
    .orderBy(desc(properties.createdAt));

  // Get room counts and map to PropertyWithCounts shape
  const propertiesWithCounts: PropertyWithCounts[] = await Promise.all(
    allProperties.map(async (p) => {
      const [roomCountResult] = await db
        .select({ count: sql<number>`count(*)` })
        .from(rooms)
        .where(eq(rooms.propertyId, p.id));
      return {
        id: p.id,
        name: p.name,
        slug: p.slug,
        description: p.description,
        address: p.address,
        city: p.city,
        country: p.country,
        property_type: p.type,
        bedrooms: p.roomCount ?? 0,
        bathrooms: 0,
        max_guests: 0,
        base_price: null,
        status: p.status ?? 'active',
        is_featured: false,
        tenant_id: p.tenantId ?? '',
        created_at: p.createdAt ? (p.createdAt instanceof Date ? p.createdAt.toISOString() : String(p.createdAt)) : '',
        tenant_name: p.tenant_name,
        room_count: Number(roomCountResult?.count || 0),
      };
    })
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="buffr-page-title mb-2">Property Management</h1>
        <p className="text-base-content/70">
          Manage all properties across all tenants on the platform
        </p>
      </div>

      <PropertyList
        properties={propertiesWithCounts} 
        userRole={user.role ?? 'admin'} 
      />
    </div>
  );
}
