/**
 * Payroll runs API
 * POST /api/payroll/runs — create draft run and compute lines for a period
 *
 * Body: { periodId: string }
 * Response: { data: { run, lines } }
 */

import { NextRequest } from 'next/server';
import { z } from 'zod';
import {
  withApiAuth,
  errorResponse,
  successResponse,
} from '@/lib/utils/api-helpers';
import { PayrollService } from '@/lib/services/payroll/PayrollService';
import { AppError } from '@/lib/utils/errors';

const payrollService = new PayrollService();

const createRunSchema = z.object({
  periodId: z.string().uuid(),
});

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

      const validation = createRunSchema.safeParse(body);
      if (!validation.success) {
        return errorResponse(
          'Invalid input',
          400,
          'VALIDATION_ERROR',
          validation.error.flatten().fieldErrors
        );
      }

      try {
        const run = await payrollService.createDraftRun(
          user.tenantId,
          validation.data.periodId
        );
        const lines = await payrollService.computeRunLines(user.tenantId, run.id);
        const { run: computedRun } = await payrollService.getRunWithLines(
          user.tenantId,
          run.id
        );
        return successResponse({ run: computedRun, lines }, 201);
      } catch (error) {
        if (error instanceof AppError) {
          return errorResponse(error.message, error.statusCode, 'PAYROLL_ERROR');
        }
        throw error;
      }
    },
    {
      requireRole: ['owner', 'manager', 'admin'],
      rateLimit: true,
    }
  );
}
