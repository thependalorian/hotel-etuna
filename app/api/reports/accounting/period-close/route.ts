/**
 * GL period close — lock accounting period after draft folio guard passes.
 * POST /api/reports/accounting/period-close { propertyId, periodEnd }
 * GET  /api/reports/accounting/period-close?propertyId=uuid
 *
 * Response POST: { data: AccountingPeriodCloseResult }
 * Response GET:  { data: { lock: AccountingPeriodLock | null, draftChargeCount: number } }
 */

import { NextRequest } from 'next/server';
import { z } from 'zod';
import {
  withApiAuth,
  errorResponse,
  successResponse,
} from '@/lib/utils/api-helpers';
import { HospitalityAccountingService } from '@/lib/services/accounting/HospitalityAccountingService';

const accountingService = new HospitalityAccountingService();

const closeBodySchema = z.object({
  propertyId: z.string().uuid(),
  periodEnd: z.string().min(1),
});

function parsePeriodEnd(value: string): Date | null {
  const d = new Date(value.includes('T') ? value : `${value}T23:59:59.999Z`);
  return Number.isNaN(d.getTime()) ? null : d;
}

export async function GET(request: NextRequest) {
  return withApiAuth(
    request,
    async (req, user) => {
      if (!user.tenantId) {
        return errorResponse('Tenant required', 403, 'FORBIDDEN');
      }

      const propertyId = req.nextUrl.searchParams.get('propertyId');
      if (!propertyId) {
        return errorResponse('propertyId is required', 400, 'VALIDATION_ERROR');
      }

      const periodEndParam = req.nextUrl.searchParams.get('periodEnd');
      const periodEnd = periodEndParam
        ? parsePeriodEnd(periodEndParam)
        : new Date();

      if (periodEndParam && !periodEnd) {
        return errorResponse('Invalid periodEnd', 400, 'VALIDATION_ERROR');
      }

      const [lock, draftChargeCount] = await Promise.all([
        accountingService.getPeriodLock(user.tenantId, propertyId),
        accountingService.countUnsettledDraftCharges(
          user.tenantId,
          propertyId,
          periodEnd ?? new Date()
        ),
      ]);

      return successResponse({ lock, draftChargeCount });
    },
    { rateLimit: true, requireRole: ['owner', 'manager'] }
  );
}

export async function POST(request: NextRequest) {
  return withApiAuth(
    request,
    async (req, user) => {
      if (!user.tenantId) {
        return errorResponse('Tenant required', 403, 'FORBIDDEN');
      }

      let body: unknown;
      try {
        body = await req.json();
      } catch {
        return errorResponse('Invalid JSON body', 400, 'VALIDATION_ERROR');
      }

      const parsed = closeBodySchema.safeParse(body);
      if (!parsed.success) {
        return errorResponse('Invalid request body', 400, 'VALIDATION_ERROR', parsed.error.flatten());
      }

      const periodEnd = parsePeriodEnd(parsed.data.periodEnd);
      if (!periodEnd) {
        return errorResponse('Invalid periodEnd', 400, 'VALIDATION_ERROR');
      }

      const result = await accountingService.closeAccountingPeriod(
        user.tenantId,
        parsed.data.propertyId,
        periodEnd,
        user.id
      );

      if (!result.success) {
        return errorResponse(
          result.error ?? 'Period close failed',
          400,
          'PERIOD_CLOSE_BLOCKED',
          { draftChargeCount: result.draftChargeCount }
        );
      }

      return successResponse(result, 201);
    },
    { rateLimit: true, requireRole: ['owner', 'manager'] }
  );
}
