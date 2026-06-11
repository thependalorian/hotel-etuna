/**
 * Platform Admin - Tenant Detail Page
 *
 * Purpose: View a single tenant and basic info (platform admin)
 * Location: app/(dashboard)/admin/platform/tenants/[id]/page.tsx
 */

import React from 'react';
import { getCurrentPlatformAdmin, isPlatformAdmin } from '@/lib/auth/platform-admin';
import { redirect, notFound } from 'next/navigation';
import Link from 'next/link';
import { db } from '@/lib/db';
import { tenants, properties, users } from '@/lib/db';
import { eq, count } from 'drizzle-orm';
import { ArrowLeft } from 'lucide-react';
import TenantDetails from '@/components/features/admin/platform/TenantDetails';

interface TenantDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function TenantDetailPage({ params }: TenantDetailPageProps) {
  const user = await getCurrentPlatformAdmin();
  if (!user || !isPlatformAdmin(user)) {
    redirect('/unauthorized');
  }

  const { id } = await params;

  const tenantRows = await db.select().from(tenants).where(eq(tenants.id, id)).limit(1);
  const tenant = tenantRows[0] ?? null;
  if (!tenant) {
    notFound();
  }

  const [propertiesCount, usersCount] = await Promise.all([
    db.select({ count: count() }).from(properties).where(eq(properties.tenantId, id)),
    db.select({ count: count() }).from(users).where(eq(users.tenantId, id)),
  ]);

  const propertyCount = propertiesCount[0]?.count ?? 0;
  const userCount = usersCount[0]?.count ?? 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link
          href="/admin/platform/tenants"
          className="btn btn-ghost btn-sm btn-square min-h-[44px]"
          title="Back to tenants"
        >
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div>
          <h1 className="etuna-page-title mb-1">{tenant.name}</h1>
          <p className="text-base-content/70">
            Tenant details · {tenant.subdomain ?? '—'} {tenant.domain ? `· ${tenant.domain}` : ''}
          </p>
        </div>
      </div>

      <TenantDetails tenant={tenant} propertyCount={propertyCount} userCount={userCount} />
    </div>
  );
}
