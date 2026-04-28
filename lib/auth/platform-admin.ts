/**
 * Platform Admin Authentication Utilities
 *
 * Purpose: Helper functions for platform admin access control using Stack Auth + Drizzle
 * Location: lib/auth/platform-admin.ts
 *
 * Features:
 * - Check if user is platform admin
 * - Check if user is super admin
 * - Validate platform admin access
 * - Get platform admin permissions
 */

import { getCurrentUser } from '@/lib/auth/stack-auth';
import { db } from '@/lib/db';
import { users } from '@/lib/db';
import { eq } from 'drizzle-orm';

// Platform tenant ID constant
export const PLATFORM_TENANT_ID = '00000000-0000-0000-0000-000000000000';

// Platform admin roles
export const PLATFORM_ADMIN_ROLES = ['super-admin', 'admin'] as const;
export type PlatformAdminRole = (typeof PLATFORM_ADMIN_ROLES)[number];

// Platform admin email domain
export const PLATFORM_ADMIN_EMAIL_DOMAIN = '@buffr.ai';

/**
 * Check if email belongs to buffr.ai domain
 */
export function isBuffrAiEmail(email: string): boolean {
  return email.endsWith(PLATFORM_ADMIN_EMAIL_DOMAIN);
}

/** User shape for isPlatformAdmin (accepts DB row camelCase or snake_case) */
type PlatformAdminUserShape = {
  email: string;
  role: string | null;
  is_platform_admin?: boolean | null;
  isPlatformAdmin?: boolean | null;
  tenant_id?: string | null;
  tenantId?: string | null;
};

/**
 * Check if user is platform admin
 * Platform admin must have:
 * - @buffr.ai email domain
 * - super-admin or admin role
 * - is_platform_admin flag OR null tenant_id OR platform tenant_id
 */
export function isPlatformAdmin(user: PlatformAdminUserShape): boolean {
  if (!isBuffrAiEmail(user.email)) {
    return false;
  }
  const role = user.role ?? '';
  if (!PLATFORM_ADMIN_ROLES.includes(role as PlatformAdminRole)) {
    return false;
  }
  const tenantId = user.tenantId ?? user.tenant_id ?? null;
  const isPlatformAdminFlag = user.isPlatformAdmin ?? user.is_platform_admin ?? false;
  return Boolean(isPlatformAdminFlag) || tenantId === null || tenantId === PLATFORM_TENANT_ID;
}

/**
 * Check if user is super admin
 */
export function isSuperAdmin(user: PlatformAdminUserShape): boolean {
  return isPlatformAdmin(user) && (user.role ?? '') === 'super-admin';
}

/**
 * Get current platform admin from Stack Auth + DB users table
 * Resolves Stack user by email to DB user row (for role/isPlatformAdmin/tenantId).
 */
export async function getCurrentPlatformAdmin(): Promise<{
  id: string;
  email: string;
  role: string | null;
  firstName: string | null;
  lastName: string | null;
  isPlatformAdmin: boolean | null;
  tenantId: string | null;
} | null> {
  const stackUser = await getCurrentUser();
  if (!stackUser?.primaryEmail) {
    return null;
  }
  const email = String(stackUser.primaryEmail);
  const rows = await db.select().from(users).where(eq(users.email, email)).limit(1);
  const dbUser = rows[0] ?? null;
  if (!dbUser || !isPlatformAdmin(dbUser)) {
    return null;
  }
  return {
    id: dbUser.id,
    email: dbUser.email,
    role: dbUser.role,
    firstName: dbUser.firstName,
    lastName: dbUser.lastName,
    isPlatformAdmin: dbUser.isPlatformAdmin,
    tenantId: dbUser.tenantId,
  };
}

/**
 * Check if current user has platform admin access
 */
export async function requirePlatformAdmin() {
  const user = await getCurrentPlatformAdmin();
  if (!user || !isPlatformAdmin(user)) {
    throw new Error('Unauthorized: Platform admin access required');
  }
  return user;
}

/**
 * Check if current user has super admin access
 */
export async function requireSuperAdmin() {
  const user = await requirePlatformAdmin();
  if (!isSuperAdmin(user)) {
    throw new Error('Unauthorized: Super admin access required');
  }
  return user;
}

/**
 * Get platform admin permissions based on role
 */
export function getPlatformAdminPermissions(role: string): {
  canManageTenants: boolean;
  canManageUsers: boolean;
  canManageProperties: boolean;
  canViewAnalytics: boolean;
  canManageSettings: boolean;
  canViewAuditLogs: boolean;
  canManageSupport: boolean;
  canAccessBilling: boolean;
} {
  const isSuperAdminRole = role === 'super-admin';
  return {
    canManageTenants: isSuperAdminRole,
    canManageUsers: isSuperAdminRole,
    canManageProperties: isSuperAdminRole,
    canViewAnalytics: true,
    canManageSettings: isSuperAdminRole,
    canViewAuditLogs: true,
    canManageSupport: true,
    canAccessBilling: isSuperAdminRole,
  };
}
