/**
 * User Profile API Route
 *
 * Purpose: Fetch user profile data
 * Location: /app/api/user/profile/route.ts
 *
 * Returns:
 * - User details
 * - Tenant information
 * - Member since date
 */

import { NextResponse, NextRequest } from 'next/server';
import { withTenantApiAuth } from '@/lib/utils/api-helpers';
import { db, users, tenants } from '@/lib/db';
import { eq } from 'drizzle-orm';
import { AppError } from '@/lib/utils/errors';
import { securityLogger } from '@/lib/utils/security-logger';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  return withTenantApiAuth(request, async (_req, user) => {
    try {
      const userId = user.id;
      const tenantId = user.tenantId as string;

      const rows = await db
        .select({
          user: users,
          tenantName: tenants.name,
          tenantCreatedAt: tenants.createdAt,
        })
        .from(users)
        .leftJoin(tenants, eq(users.tenantId, tenants.id))
        .where(eq(users.id, userId))
        .limit(1);
      const first = rows[0];
      const userRecord = first?.user;

      if (!userRecord) {
        throw new AppError(404, 'User not found');
      }

      const memberSince = userRecord.createdAt
        ? new Date(userRecord.createdAt).getFullYear().toString()
        : new Date().getFullYear().toString();

      return NextResponse.json({
        firstName: userRecord.firstName || '',
        lastName: userRecord.lastName || '',
        email: userRecord.email || '',
        role: userRecord.role || 'USER',
        tenantName: first?.tenantName || 'Default',
        memberSince,
      });
    } catch (error) {
      if (error instanceof AppError) {
        return NextResponse.json({ message: error.message }, { status: error.statusCode });
      }
      securityLogger.error('Error fetching user profile:', error);
      return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
    }
  });
}
