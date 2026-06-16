/**
 * @fileoverview API route //api/staff/stats
 * Location: /app/api/staff/stats/route.ts
 */

import { NextRequest } from 'next/server';
import {
  withPlatformApiAuth,
  errorResponse,
  successResponse,
} from '@/lib/utils/api-helpers';
import { securityLogger } from '@/lib/utils/security-logger';
import { db, staff } from '@/lib/db';
import { eq, sql } from 'drizzle-orm';

/**
 * GET /api/staff/stats
 * Response: { totalStaff, activeStaff, departments, newHiresThisMonth }
 */
export async function GET(request: NextRequest) {
  return withPlatformApiAuth(
    request,
    async (_req, user) => {
      if (!user.tenantId) {
        return errorResponse('Unauthorized', 401, 'UNAUTHORIZED');
      }

      try {
        const tenantId = user.tenantId;
        const startOfMonth = new Date();
        startOfMonth.setDate(1);
        startOfMonth.setHours(0, 0, 0, 0);

        const [aggregate] = await db
          .select({
            totalStaff: sql<number>`count(*)::int`,
            activeStaff: sql<number>`count(*) filter (where ${staff.status} = 'active')::int`,
            departments: sql<number>`count(distinct ${staff.department})::int`,
            newHiresThisMonth: sql<number>`count(*) filter (where ${staff.hireDate} >= ${startOfMonth.toISOString().slice(0, 10)})::int`,
          })
          .from(staff)
          .where(eq(staff.tenantId, tenantId));

        return successResponse({
          totalStaff: aggregate?.totalStaff ?? 0,
          activeStaff: aggregate?.activeStaff ?? 0,
          departments: aggregate?.departments ?? 0,
          newHiresThisMonth: aggregate?.newHiresThisMonth ?? 0,
        });
      } catch (error) {
        securityLogger.error('Error fetching staff stats:', error);
        return errorResponse('Internal server error', 500, 'INTERNAL_ERROR');
      }
    },
    { rateLimit: true }
  );
}
