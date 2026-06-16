/**
 * @fileoverview API route //api/payroll/periods
 * Location: /app/api/payroll/periods/route.ts
 */

/**
 * Payroll periods API
 * GET /api/payroll/periods — list periods (owner, manager, admin)
 * POST /api/payroll/periods — create period (owner, admin only)
 *
 * Response: { data: PayrollPeriod | PayrollPeriod[] }
 */

import { NextRequest } from 'next/server';
import { z } from 'zod';
import {
  withApiAuth,
  errorResponse,
  successResponse,
} from '@/lib/utils/api-helpers';
import { PayrollService } from '@/lib/services/payroll/PayrollService';

const payrollService = new PayrollService();

const createPeriodSchema = z.object({
  periodLabel: z.string().min(1).max(50),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  payDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
});

export async function GET(request: NextRequest) {
  return withApiAuth(
    request,
    async (req, user) => {
      if (!user.tenantId) {
        return errorResponse('Tenant ID is required', 400, 'MISSING_TENANT_ID');
      }
      const periods = await payrollService.listPeriods(user.tenantId);
      return successResponse(periods);
    },
    {
      requireRole: ['owner', 'manager', 'admin'],
      rateLimit: true,
    }
  );
}

export async function POST(request: NextRequest) {
  return withApiAuth(
    request,
    async (req, user) => {
      if (!user.tenantId) {
        return errorResponse('Tenant ID is required', 400, 'MISSING_TENANT_ID');
      }

      let body: unknown;
      try {
        body = await req.json();
      } catch {
        return errorResponse('Invalid JSON in request body', 400, 'INVALID_JSON');
      }

      const validation = createPeriodSchema.safeParse(body);
      if (!validation.success) {
        return errorResponse(
          'Invalid input',
          400,
          'VALIDATION_ERROR',
          validation.error.flatten().fieldErrors
        );
      }

      const { startDate, endDate, payDate } = validation.data;
      if (startDate > endDate) {
        return errorResponse('startDate must be on or before endDate', 400, 'VALIDATION_ERROR');
      }

      const period = await payrollService.createPeriod(user.tenantId, validation.data);
      return successResponse(period, 201);
    },
    {
      requireRole: ['owner', 'admin'],
      rateLimit: true,
    }
  );
}
