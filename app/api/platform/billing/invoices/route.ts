/**
 * @fileoverview API route //api/platform/billing/invoices
 * Location: /app/api/platform/billing/invoices/route.ts
 */

/**
 * Platform invoices — list and generate monthly draft.
 * Location: app/api/platform/billing/invoices/route.ts
 */

import { NextRequest } from 'next/server';
import { z } from 'zod';
import { withApiAuth, errorResponse, successResponse } from '@/lib/utils/api-helpers';
import { PlatformBillingService } from '@/lib/services/billing/PlatformBillingService';

const generateSchema = z.object({
  yearMonth: z.string().regex(/^\d{4}-\d{2}$/, 'yearMonth must be YYYY-MM'),
});

export async function GET(request: NextRequest) {
  return withApiAuth(
    request,
    async (_req, user) => {
      if (!user.tenantId) {
        return errorResponse('Tenant required', 400, 'MISSING_TENANT_ID');
      }
      const billing = new PlatformBillingService();
      const invoices = await billing.listInvoices(user.tenantId);
      const yearMonth = new Date().toISOString().slice(0, 7);
      const accrualSummary = await billing.accrualSummary(user.tenantId, yearMonth);
      const schedule = await billing.getFeeSchedule(user.tenantId);
      return successResponse({ invoices, accrualSummary, schedule, yearMonth });
    },
    { requireRole: ['owner', 'manager', 'admin'], rateLimit: true }
  );
}

export async function POST(request: NextRequest) {
  return withApiAuth(
    request,
    async (req, user) => {
      if (!user.tenantId) {
        return errorResponse('Tenant required', 400, 'MISSING_TENANT_ID');
      }

      let body: unknown;
      try {
        body = await req.json();
      } catch {
        return errorResponse('Invalid JSON', 400, 'INVALID_JSON');
      }

      const parsed = generateSchema.safeParse(body);
      if (!parsed.success) {
        return errorResponse('Invalid input', 400, 'VALIDATION_ERROR', parsed.error.flatten());
      }

      const billing = new PlatformBillingService();
      const result = await billing.generateMonthlyInvoice(
        user.tenantId,
        parsed.data.yearMonth
      );
      return successResponse(result, 201);
    },
    { requireRole: ['owner', 'manager', 'admin'], rateLimit: true }
  );
}
