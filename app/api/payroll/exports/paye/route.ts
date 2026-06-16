/**
 * @fileoverview API route //api/payroll/exports/paye
 * Location: /app/api/payroll/exports/paye/route.ts
 */

/**
 * PAYE statutory export API
 * GET /api/payroll/exports/paye?periodId=<uuid>
 *
 * Returns text/csv for NamRA PAYE remittance (approved run lines).
 */

import { NextRequest, NextResponse } from 'next/server';
import { withApiAuth, errorResponse } from '@/lib/utils/api-helpers';
import { PayrollService } from '@/lib/services/payroll/PayrollService';
import { AppError } from '@/lib/utils/errors';

const payrollService = new PayrollService();

export async function GET(request: NextRequest) {
  return withApiAuth(
    request,
    async (req, user) => {
      if (!user.tenantId) {
        return errorResponse('Tenant ID is required', 400, 'MISSING_TENANT_ID');
      }

      const periodId = req.nextUrl.searchParams.get('periodId');
      if (!periodId) {
        return errorResponse('periodId query parameter is required', 400, 'VALIDATION_ERROR');
      }

      try {
        const csv = await payrollService.exportPayeCsv(user.tenantId, periodId);
        return new NextResponse(csv, {
          status: 200,
          headers: {
            'Content-Type': 'text/csv; charset=utf-8',
            'Content-Disposition': `attachment; filename="paye-${periodId}.csv"`,
            'Cache-Control': 'no-store',
          },
        });
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
