/**
 * Platform Admin - User detail
 *
 * Purpose: Single user view for platform admins
 * Location: app/(dashboard)/admin/platform/users/[id]/page.tsx
 */

import React from 'react';
import Link from 'next/link';
import { redirect, notFound } from 'next/navigation';
import { getCurrentPlatformAdmin, isPlatformAdmin } from '@/lib/auth/platform-admin';
import { db, users, tenants } from '@/lib/db';
import { eq } from 'drizzle-orm';
import { ArrowLeft, Mail } from 'lucide-react';
import UserDetails from '@/components/features/admin/platform/UserDetails';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function PlatformUserDetailPage({ params }: PageProps) {
  const admin = await getCurrentPlatformAdmin();
  if (!admin || !isPlatformAdmin(admin)) {
    redirect('/unauthorized');
  }

  const { id } = await params;

  const rows = await db
    .select({
      user: users,
      tenantName: tenants.name,
    })
    .from(users)
    .leftJoin(tenants, eq(users.tenantId, tenants.id))
    .where(eq(users.id, id))
    .limit(1);

  const row = rows[0];
  if (!row) {
    notFound();
  }

  const u = row.user;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link
          href="/admin/platform/users"
          className="btn btn-ghost btn-sm btn-square min-h-[44px]"
          title="Back to users"
        >
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div>
          <h1 className="buffr-page-title mb-1">
            {u.firstName || u.lastName ? `${u.firstName ?? ''} ${u.lastName ?? ''}`.trim() : u.email}
          </h1>
          <p className="text-base-content/70 flex items-center gap-2 flex-wrap">
            <Mail className="w-4 h-4" />
            {u.email}
          </p>
        </div>
      </div>

      <UserDetails
        user={{
          email: u.email,
          firstName: u.firstName,
          lastName: u.lastName,
          role: u.role,
          status: u.status,
          emailVerified: u.emailVerified,
          phone: u.phone,
          isPlatformAdmin: u.isPlatformAdmin,
          createdAt: u.createdAt,
          lastLoginAt: u.lastLoginAt,
        }}
        tenantName={row.tenantName}
      />
    </div>
  );
}
