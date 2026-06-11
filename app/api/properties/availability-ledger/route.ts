/**
 * Availability ledger API — daily room inventory buckets (OSS W6)
 *
 * GET  /api/properties/availability-ledger?propertyId=&startDate=&endDate=
 * PATCH /api/properties/availability-ledger — apply stop-sell or upsert bucket
 *
 * Response GET: { success: true, data: { propertyId, startDate, endDate, entries: LedgerRow[] } }
 * Response PATCH: { success: true, data: { updated: LedgerRow[] } }
 */

import { NextRequest } from 'next/server';
import { z } from 'zod';
import {
  withApiAuth,
  errorResponse,
  successResponse,
  validateJsonBody,
} from '@/lib/utils/api-helpers';
import { availabilityLedgerService } from '@/lib/services/property/AvailabilityLedgerService';

const STAFF_ROLES = ['owner', 'manager', 'admin', 'staff', 'housekeeping_supervisor'];

const isoDateSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be YYYY-MM-DD');

const patchLedgerSchema = z
  .object({
    propertyId: z.string().uuid(),
    businessDate: isoDateSchema,
    roomId: z.string().uuid().optional(),
    stopSell: z.boolean().optional(),
    outOfOrder: z.boolean().optional(),
    blocked: z.number().int().min(0).optional(),
    sold: z.number().int().min(0).optional(),
    cta: z.boolean().optional(),
    ctd: z.boolean().optional(),
  })
  .refine(
    (v) =>
      v.stopSell !== undefined ||
      v.outOfOrder !== undefined ||
      v.blocked !== undefined ||
      v.sold !== undefined ||
      v.cta !== undefined ||
      v.ctd !== undefined,
    { message: 'At least one ledger field must be provided' }
  );

export async function GET(request: NextRequest) {
  return withApiAuth(
    request,
    async (req, user) => {
      if (!user.tenantId) {
        return errorResponse('Tenant ID is required', 400, 'MISSING_TENANT_ID');
      }

      const { searchParams } = new URL(req.url);
      const propertyId = searchParams.get('propertyId');
      const startDate = searchParams.get('startDate');
      const endDate = searchParams.get('endDate');

      if (!propertyId || !startDate || !endDate) {
        return errorResponse(
          'propertyId, startDate, and endDate are required',
          400,
          'MISSING_PARAMS'
        );
      }

      const startParsed = isoDateSchema.safeParse(startDate);
      const endParsed = isoDateSchema.safeParse(endDate);
      if (!startParsed.success || !endParsed.success) {
        return errorResponse('Invalid date format', 400, 'VALIDATION_ERROR');
      }
      if (startDate >= endDate) {
        return errorResponse('endDate must be after startDate', 400, 'INVALID_RANGE');
      }

      await availabilityLedgerService.assertPropertyInTenant(propertyId, user.tenantId);

      const entries = await availabilityLedgerService.getLedgerForDateRange(
        propertyId,
        startDate,
        endDate,
        user.tenantId
      );

      return successResponse({
        propertyId,
        startDate,
        endDate,
        entries,
      });
    },
    { requireRole: STAFF_ROLES, rateLimit: true }
  );
}

export async function PATCH(request: NextRequest) {
  return withApiAuth(
    request,
    async (req, user) => {
      if (!user.tenantId) {
        return errorResponse('Tenant ID is required', 400, 'MISSING_TENANT_ID');
      }

      const input = await validateJsonBody(req, patchLedgerSchema);
      await availabilityLedgerService.assertPropertyInTenant(input.propertyId, user.tenantId);

      if (input.stopSell !== undefined && input.roomId === undefined) {
        const updated = await availabilityLedgerService.applyStopSell({
          tenantId: user.tenantId,
          propertyId: input.propertyId,
          businessDate: input.businessDate,
          stopSell: input.stopSell,
        });
        return successResponse({ updated });
      }

      if (!input.roomId) {
        return errorResponse(
          'roomId is required when not applying property-wide stop-sell',
          400,
          'MISSING_ROOM_ID'
        );
      }

      const row = await availabilityLedgerService.upsertDailyBucket({
        tenantId: user.tenantId,
        propertyId: input.propertyId,
        roomId: input.roomId,
        businessDate: input.businessDate,
        stopSell: input.stopSell,
        outOfOrder: input.outOfOrder,
        blocked: input.blocked,
        sold: input.sold,
        cta: input.cta,
        ctd: input.ctd,
      });

      return successResponse({ updated: [row] });
    },
    { requireRole: ['owner', 'manager', 'admin'], rateLimit: true }
  );
}
