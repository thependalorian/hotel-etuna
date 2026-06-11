/**
 * Tenant Management Page
 * 
 * Purpose: Platform admin page for managing all tenants
 * Location: app/(dashboard)/admin/platform/tenants/page.tsx
 * 
 * Database: Uses Drizzle ORM with Neon PostgreSQL
 */

import React from 'react';
import { getCurrentPlatformAdmin } from '@/lib/auth/platform-admin';
import TenantList from '@/components/features/admin/platform/TenantList';
import { db, tenants, users, properties } from '@/lib/db';
import { desc, eq, sql } from 'drizzle-orm';

interface TenantWithCounts {
  id: string;
  name: string;
  subdomain: string | null;
  domain: string | null;
  status: string;
  room_count: number;
  property_type: string | null;
  has_restaurant_features: boolean;
  created_at: string;
  updated_at: string;
  user_count: number;
  property_count: number;
}

export default async function TenantsPage() {
  const user = await getCurrentPlatformAdmin();
  
  if (!user) {
    return null; // Layout will handle redirect
  }

  // Fetch tenants with counts using Drizzle ORM
  const allTenants = await db
    .select()
    .from(tenants)
    .orderBy(desc(tenants.createdAt));

  // Get counts for each tenant and map to TenantWithCounts shape
  const tenantsWithCounts: TenantWithCounts[] = await Promise.all(
    allTenants.map(async (t) => {
      const [userCountResult] = await db
        .select({ count: sql<number>`count(*)` })
        .from(users)
        .where(eq(users.tenantId, t.id));

      const [propertyCountResult] = await db
        .select({ count: sql<number>`count(*)` })
        .from(properties)
        .where(eq(properties.tenantId, t.id));

      return {
        id: t.id,
        name: t.name,
        subdomain: t.subdomain,
        domain: t.domain,
        status: t.status ?? 'active',
        room_count: 0,
        property_type: null,
        has_restaurant_features: false,
        created_at: t.createdAt ? (t.createdAt instanceof Date ? t.createdAt.toISOString() : String(t.createdAt)) : '',
        updated_at: t.updatedAt ? (t.updatedAt instanceof Date ? t.updatedAt.toISOString() : String(t.updatedAt)) : '',
        user_count: Number(userCountResult?.count || 0),
        property_count: Number(propertyCountResult?.count || 0),
      };
    })
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="etuna-page-title mb-2">Tenant Management</h1>
        <p className="text-base-content/70">
          Manage referral partner tenants — Hotel Etuna is the single hub property
        </p>
      </div>

      <TenantList
        tenants={tenantsWithCounts} 
        userRole={user.role ?? 'admin'} 
      />
    </div>
  );
}
