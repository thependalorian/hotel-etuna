/**
 * Platform Users API Route
 * 
 * Purpose: API endpoint for platform admin user management
 * Location: app/api/admin/platform/users/route.ts
 * 
 * Features:
 * - GET: List all users (platform admin)
 */

import { NextRequest, NextResponse } from 'next/server';
import { withPlatformAdminAuth } from '@/lib/auth/with-platform-admin-auth';
import { db, users, tenants } from '@/lib/db';
import { desc, eq, sql } from 'drizzle-orm';
import { securityLogger } from '@/lib/utils/security-logger';

// GET - List all users
export async function GET(request: NextRequest) {
  return withPlatformAdminAuth(request, async (req) => {
  try {
    const url = new URL(req!.url);
    const search = url.searchParams.get('search') || '';
    const role = url.searchParams.get('role') || 'all';
    const status = url.searchParams.get('status') || 'all';

    // Build query
    const query = db
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
      .where(sql`${users.role} NOT IN ('super-admin')`)
      .orderBy(desc(users.createdAt));

    const allUsers = await query;

    // Apply filters in memory (simplified for now)
    let filtered = allUsers;
    
    if (search) {
      const searchLower = search.toLowerCase();
      filtered = filtered.filter(u => 
        u.email.toLowerCase().includes(searchLower) ||
        (u.first_name && u.first_name.toLowerCase().includes(searchLower)) ||
        (u.last_name && u.last_name.toLowerCase().includes(searchLower))
      );
    }

    if (role !== 'all') {
      filtered = filtered.filter(u => u.role === role);
    }

    if (status !== 'all') {
      filtered = filtered.filter(u => u.status === status);
    }

    return NextResponse.json({ data: filtered });
  } catch (error) {
    securityLogger.error('Error fetching users:', error);
    return NextResponse.json(
      { error: 'Failed to fetch users' },
      { status: 500 }
    );
  }
  });
}
