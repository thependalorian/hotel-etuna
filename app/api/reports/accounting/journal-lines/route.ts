/**
 * @fileoverview API route //api/reports/accounting/journal-lines
 * Location: /app/api/reports/accounting/journal-lines/route.ts
 */

/**
 * Journal lines for an accounting period (Namibia hospitality COA).
 * GET /api/reports/accounting/journal-lines?from=ISO&to=ISO
 *
 * Response: { data: { period: { from, to }, currency, lines: JournalLine[] } }
 */

import { NextRequest } from 'next/server';
import {
  withApiAuth,
  errorResponse,
  successResponse,
} from '@/lib/utils/api-helpers';
import { HospitalityAccountingService } from '@/lib/services/accounting/HospitalityAccountingService';

const accountingService = new HospitalityAccountingService();

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

      const report = await accountingService.getPeriodReport(user.tenantId, from, to);

      return successResponse({
        period: report.period,
        currency: report.currency,
        lines: report.journalLines,
        journalLineCount: report.journalLineCount,
      });
    },
    { rateLimit: true, requireRole: ['owner', 'manager', 'admin'] }
  );
}
