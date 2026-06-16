/**
 * @fileoverview API route //api/fnb/print-jobs
 * Location: /app/api/fnb/print-jobs/route.ts
 */

/**
 * F&B Print Jobs API
 *
 * Purpose: List and create kitchen/bar print dispatch jobs for staff.
 * Location: /app/api/fnb/print-jobs/route.ts
 *
 * GET  /api/fnb/print-jobs?propertyId=&station=&status=
 * POST /api/fnb/print-jobs — create pending job
 *
 * Response: { success: true, data: FnbPrintJob | FnbPrintJob[] }
 */

import { NextRequest } from 'next/server';
import { z } from 'zod';
import {
  withApiAuth,
  errorResponse,
  successResponse,
  validateJsonBody,
} from '@/lib/utils/api-helpers';
import {
  fnbPrintDispatchService,
  type PrintJobStatus,
  type PrintStation,
} from '@/lib/services/fnb/fnb-print-dispatch-service';

const STAFF_ROLES = ['owner', 'manager', 'admin', 'staff', 'kitchen', 'housekeeping_supervisor'];

const stationSchema = z.enum(['kitchen', 'bar', 'pastry', 'front_desk', 'back_office']);
const statusSchema = z.enum(['pending', 'printing', 'printed', 'failed', 'cancelled']);

const createPrintJobSchema = z.object({
  propertyId: z.string().uuid(),
  orderId: z.string().uuid().optional().nullable(),
  bookingId: z.string().uuid().optional().nullable(),
  station: stationSchema.default('kitchen'),
  ticketType: z.string().max(50).optional(),
  ticketData: z.record(z.string(), z.unknown()),
  printerId: z.string().max(100).optional().nullable(),
});

export async function GET(request: NextRequest) {
  return withApiAuth(
    request,
    async (req, user) => {
      if (!user.tenantId) {
        return errorResponse('Tenant ID is required', 400, 'MISSING_TENANT_ID');
      }

      const { searchParams } = new URL(req.url);
      const propertyId = searchParams.get('propertyId');
      if (!propertyId) {
        return errorResponse('propertyId is required', 400, 'MISSING_PROPERTY_ID');
      }

      await fnbPrintDispatchService.assertPropertyInTenant(propertyId, user.tenantId);

      const stationParam = searchParams.get('station');
      const statusParam = searchParams.get('status');

      let station: PrintStation | undefined;
      if (stationParam) {
        const parsedStation = stationSchema.safeParse(stationParam);
        if (!parsedStation.success) {
          return errorResponse('Invalid station', 400, 'VALIDATION_ERROR');
        }
        station = parsedStation.data;
      }

      let status: PrintJobStatus | undefined;
      if (statusParam) {
        const parsedStatus = statusSchema.safeParse(statusParam);
        if (!parsedStatus.success) {
          return errorResponse('Invalid status', 400, 'VALIDATION_ERROR');
        }
        status = parsedStatus.data;
      }

      const jobs = await fnbPrintDispatchService.listJobs(propertyId, { station, status });
      return successResponse(jobs);
    },
    { requireRole: STAFF_ROLES, rateLimit: true }
  );
}

export async function POST(request: NextRequest) {
  return withApiAuth(
    request,
    async (req, user) => {
      if (!user.tenantId) {
        return errorResponse('Tenant ID is required', 400, 'MISSING_TENANT_ID');
      }

      const body = await validateJsonBody(req, createPrintJobSchema);
      await fnbPrintDispatchService.assertPropertyInTenant(body.propertyId, user.tenantId);

      const job = await fnbPrintDispatchService.createJob({
        propertyId: body.propertyId,
        orderId: body.orderId ?? null,
        bookingId: body.bookingId ?? null,
        station: body.station,
        ticketType: body.ticketType,
        ticketData: body.ticketData,
        printerId: body.printerId ?? null,
        createdBy: user.id ?? null,
      });

      return successResponse(job, 201);
    },
    { requireRole: STAFF_ROLES, rateLimit: true }
  );
}
