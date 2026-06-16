/**
 * @fileoverview API route //api/reports/property-vat
 * Location: /app/api/reports/property-vat/route.ts
 */

/**
 * Property hospitality VAT period report (Hotel Etuna guest supplies).
 * GET /api/reports/property-vat?from=ISO&to=ISO
 *
 * Response: { data: PropertyVatPeriodReport }
 * Auth: hub staff (owner, manager, admin). Not Buffr platform fee VAT.
 */

import { NextRequest } from 'next/server';
import {
  withApiAuth,
  errorResponse,
  successResponse,
} from '@/lib/utils/api-helpers';
import { PropertyVatService } from '@/lib/services/tax/PropertyVatService';

const propertyVatService = new PropertyVatService();

function parseDateParam(value: string | null, fallback: Date): Date {
  if (!value) return fallback;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? fallback : d;
}

export async function GET(request: NextRequest) {
  return withApiAuth(
    request,
    async (req, user) => {
      if (!user.tenantId) {
        return errorResponse('Tenant required', 403, 'FORBIDDEN');
      }

      const now = new Date();
      const defaultFrom = new Date(now.getFullYear(), now.getMonth(), 1);
      const from = parseDateParam(req.nextUrl.searchParams.get('from'), defaultFrom);
      const to = parseDateParam(req.nextUrl.searchParams.get('to'), now);

      if (from > to) {
        return errorResponse('from must be before to', 400, 'VALIDATION_ERROR');
      }

      const report = await propertyVatService.getSettledSuppliesReport(
        user.tenantId,
        from,
        to
      );
      return successResponse(report);
    },
    { rateLimit: true, requireRole: ['owner', 'manager', 'admin'] }
  );
}
