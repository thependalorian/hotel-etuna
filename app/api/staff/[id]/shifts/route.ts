/**
 * Staff shifts for one employee
 * Location: app/api/staff/[id]/shifts/route.ts
 *
 * GET ?startDate=YYYY-MM-DD
 */

import { NextRequest, NextResponse } from 'next/server';
import { withApiAuth, errorResponse } from '@/lib/utils/api-helpers';
import { db, staffShifts, staff } from '@/lib/db';
import { and, eq, gte, lte } from 'drizzle-orm';
import { entityId } from '@/lib/validation/entity-ids';
import * as z from 'zod';

const shiftsQuerySchema = z.object({
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

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withApiAuth(
    request,
    async (req, user) => {
      if (!user.tenantId) {
        return errorResponse('Tenant ID is required', 400, 'MISSING_TENANT_ID');
      }

      const { id: staffId } = await params;
      const idCheck = entityId('Invalid staff ID').safeParse(staffId);
      if (!idCheck.success) {
        return errorResponse('Invalid staff ID', 400, 'VALIDATION_ERROR');
      }

      const parsed = shiftsQuerySchema.safeParse({
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

      const { from, to } = monthRange(parsed.data.startDate);

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
            eq(staffShifts.staffId, staffId),
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
      requireRole: ['owner', 'manager', 'admin'],
      rateLimit: true,
    }
  );
}

const createShiftSchema = z.object({
  propertyId: entityId('Invalid property ID'),
  shiftDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  startTime: z.string().regex(/^\d{2}:\d{2}(:\d{2})?$/),
  endTime: z.string().regex(/^\d{2}:\d{2}(:\d{2})?$/),
  position: z.string().optional(),
  shiftType: z.string().optional(),
  notes: z.string().max(500).optional(),
});

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withApiAuth(
    request,
    async (req, user) => {
      if (!user.tenantId) {
        return errorResponse('Tenant ID is required', 400, 'MISSING_TENANT_ID');
      }
      const { id: staffId } = await params;
      const body = await req.json();
      const parsed = createShiftSchema.safeParse(body);
      if (!parsed.success) {
        return errorResponse('Invalid body', 400, 'VALIDATION_ERROR', parsed.error.flatten().fieldErrors);
      }
      const { StaffShiftService } = await import('@/lib/services/staff/StaffShiftService');
      const service = new StaffShiftService();
      const shift = await service.createShift(user.tenantId, {
        staffId,
        ...parsed.data,
      });
      return NextResponse.json({ data: shift }, { status: 201 });
    },
    { requireRole: ['owner', 'manager', 'admin'], rateLimit: true }
  );
}
