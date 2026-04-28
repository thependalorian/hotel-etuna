/**
 * User Management Page
 * 
 * Purpose: Platform admin page for managing all users across tenants
 * Location: app/(dashboard)/admin/platform/users/page.tsx
 * 
 * Database: Uses Drizzle ORM with Neon PostgreSQL
 */

import React from 'react';
import { getCurrentPlatformAdmin } from '@/lib/auth/platform-admin';
import UserList from '@/components/features/admin/platform/UserList';
import { db, users, tenants } from '@/lib/db';
import { desc, eq, sql, or, like } from 'drizzle-orm';

interface UserWithTenant {
  id: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
  role: string;
  status: string;
  tenant_id: string | null;
  is_email_verified: boolean;
  created_at: string;
  last_login_at: string | null;
  tenant_name: string | null;
}

export default async function UsersPage() {
  const user = await getCurrentPlatformAdmin();
  
  if (!user) {
    return null; // Layout will handle redirect
  }

  // Fetch all users with tenant info
  const allUsers = await db
    .select({
      id: users.id,
      email: users.email,
      first_name: users.firstName,
      last_name: users.lastName,
      role: users.role,
      status: users.status,
      tenant_id: users.tenantId,
      is_email_verified: users.emailVerified,
      created_at: users.createdAt,
      last_login_at: users.lastLoginAt,
      tenant_name: tenants.name,
    })
    .from(users)
    .leftJoin(tenants, eq(users.tenantId, tenants.id))
    .where(sql`${users.role} NOT IN ('super-admin', 'owner') OR ${users.role} IS NULL`)
    .orderBy(desc(users.createdAt));

  const usersWithTenant: UserWithTenant[] = allUsers.map((u) => ({
    id: u.id,
    email: u.email,
    first_name: u.first_name,
    last_name: u.last_name,
    role: u.role ?? 'user',
    status: u.status ?? 'active',
    tenant_id: u.tenant_id,
    is_email_verified: u.is_email_verified ?? false,
    created_at: u.created_at ? (u.created_at instanceof Date ? u.created_at.toISOString() : String(u.created_at)) : '',
    last_login_at: u.last_login_at ? (u.last_login_at instanceof Date ? u.last_login_at.toISOString() : String(u.last_login_at)) : null,
    tenant_name: u.tenant_name,
  }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="buffr-page-title mb-2">User Management</h1>
        <p className="text-base-content/70">
          Manage all users across all tenants on the platform
        </p>
      </div>

      <UserList
        users={usersWithTenant} 
        userRole={user.role ?? 'admin'} 
      />
    </div>
  );
}
