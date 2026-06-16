/**
 * @fileoverview API route //api/staff/shifts
 * Location: /app/api/staff/shifts/route.ts
 */

/**
 * Staff shifts API (property-wide)
 * Location: app/api/staff/shifts/route.ts
 *
 * GET ?propertyId=&startDate=YYYY-MM-DD — shifts for month window
 */

import { NextRequest, NextResponse } from 'next/server';
import { withApiAuth, errorResponse } from '@/lib/utils/api-helpers';
import { db, staffShifts, staff } from '@/lib/db';
import { and, eq, gte, lte } from 'drizzle-orm';
import { entityId } from '@/lib/validation/entity-ids';
import * as z from 'zod';

const shiftsQuerySchema = z.object({
  propertyId: entityId('Invalid property ID'),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'startDate must be YYYY-MM-DD'),
});

function monthRange(startDate: string): { from: string; to: string } {
  const monthStart = new Date(startDate);
  const monthEnd = new Date(monthStart.getFullYear(), monthStart.getMonth() + 1, 0);
  return {
    from: monthStart.toISOString().slice(0, 10),
    to: monthEnd.toISOString().slice(0, 10),
  };
}

export async function GET(request: NextRequest) {
  return withApiAuth(
    request,
    async (req, user) => {
      if (!user.tenantId) {
        return errorResponse('Tenant ID is required', 400, 'MISSING_TENANT_ID');
      }

      const parsed = shiftsQuerySchema.safeParse({
        propertyId: req.nextUrl.searchParams.get('propertyId'),
        startDate: req.nextUrl.searchParams.get('startDate'),
      });

      if (!parsed.success) {
        return errorResponse(
          'Invalid query parameters',
          400,
          'VALIDATION_ERROR',
          parsed.error.flatten().fieldErrors
        );
      }

      const { propertyId, startDate } = parsed.data;
      const { from, to } = monthRange(startDate);

      const rows = await db
        .select({
          id: staffShifts.id,
          staffId: staffShifts.staffId,
          shiftDate: staffShifts.shiftDate,
          startTime: staffShifts.startTime,
          endTime: staffShifts.endTime,
          position: staffShifts.position,
          firstName: staff.firstName,
          lastName: staff.lastName,
        })
        .from(staffShifts)
        .innerJoin(staff, eq(staffShifts.staffId, staff.id))
        .where(
          and(
            eq(staffShifts.tenantId, user.tenantId),
            eq(staffShifts.propertyId, propertyId),
            gte(staffShifts.shiftDate, from),
            lte(staffShifts.shiftDate, to)
          )
        );

      const payload = rows.map((row) => {
        const dateStr = String(row.shiftDate);
        const start = new Date(`${dateStr}T${row.startTime}`);
        const end = new Date(`${dateStr}T${row.endTime}`);
        return {
          id: row.id,
          staffId: row.staffId,
          staffName: `${row.firstName} ${row.lastName}`,
          firstName: row.firstName,
          lastName: row.lastName,
          startDate: start.toISOString(),
          endDate: end.toISOString(),
          start: start.toISOString(),
          end: end.toISOString(),
          position: row.position,
        };
      });

      /** ScheduleCalendar expects a top-level array. */
      return NextResponse.json(payload);
    },
    {
      requireRole: ['owner', 'manager', 'admin', 'staff'],
      rateLimit: true,
    }
  );
}
