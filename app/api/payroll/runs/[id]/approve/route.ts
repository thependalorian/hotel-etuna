/**
 * Payroll run approval API
 * POST /api/payroll/runs/[id]/approve — approve computed run and issue payslips
 *
 * Response: { data: { run, payslips } }
 */

import { NextRequest } from 'next/server';
import {
  withApiAuth,
  errorResponse,
  successResponse,
} from '@/lib/utils/api-helpers';
import { PayrollService } from '@/lib/services/payroll/PayrollService';
import { AppError } from '@/lib/utils/errors';

const payrollService = new PayrollService();

type RouteContext = { params: Promise<{ id: string }> };

export async function POST(request: NextRequest, context: RouteContext) {
  return withApiAuth(
    request,
    async (req, user) => {
      if (!user.tenantId || !user.id) {
        return errorResponse('Tenant ID is required', 400, 'MISSING_TENANT_ID');
      }

      const { id } = await context.params;
      if (!id) {
        return errorResponse('Run ID is required', 400, 'VALIDATION_ERROR');
      }

      try {
        const result = await payrollService.approveRun(user.tenantId, id, user.id);
        return successResponse(result);
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
