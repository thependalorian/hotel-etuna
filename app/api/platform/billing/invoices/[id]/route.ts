/**
 * Single platform invoice — detail, issue, mark paid.
 * Location: app/api/platform/billing/invoices/[id]/route.ts
 */

import { NextRequest } from 'next/server';
import { z } from 'zod';
import { withApiAuth, errorResponse, successResponse } from '@/lib/utils/api-helpers';
import { PlatformBillingService } from '@/lib/services/billing/PlatformBillingService';
import { entityId } from '@/lib/validation/entity-ids';

type RouteContext = { params: Promise<{ id: string }> };

const markPaidSchema = z.object({
  action: z.enum(['issue', 'mark_paid']),
  paymentReference: z.string().min(1).optional(),
});

export async function GET(request: NextRequest, context: RouteContext) {
  return withApiAuth(
    request,
    async (_req, user) => {
      if (!user.tenantId) {
        return errorResponse('Tenant required', 400, 'MISSING_TENANT_ID');
      }
      const { id } = await context.params;
      const parsedId = entityId().safeParse(id);
      if (!parsedId.success) {
        return errorResponse('Invalid invoice id', 400, 'VALIDATION_ERROR');
      }

      const billing = new PlatformBillingService();
      const detail = await billing.getInvoiceWithLines(parsedId.data, user.tenantId);
      return successResponse(detail);
    },
    { requireRole: ['owner', 'manager', 'admin'], rateLimit: true }
  );
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  return withApiAuth(
    request,
    async (req, user) => {
      if (!user.tenantId) {
        return errorResponse('Tenant required', 400, 'MISSING_TENANT_ID');
      }
      const { id } = await context.params;
      const parsedId = entityId().safeParse(id);
      if (!parsedId.success) {
        return errorResponse('Invalid invoice id', 400, 'VALIDATION_ERROR');
      }

      let body: unknown;
      try {
        body = await req.json();
      } catch {
        return errorResponse('Invalid JSON', 400, 'INVALID_JSON');
      }

      const parsed = markPaidSchema.safeParse(body);
      if (!parsed.success) {
        return errorResponse('Invalid input', 400, 'VALIDATION_ERROR', parsed.error.flatten());
      }

      const billing = new PlatformBillingService();

      if (parsed.data.action === 'issue') {
        const invoice = await billing.issueInvoice(parsedId.data, user.tenantId);
        return successResponse(invoice);
      }

      if (!parsed.data.paymentReference) {
        return errorResponse('paymentReference required', 400, 'VALIDATION_ERROR');
      }

      const invoice = await billing.markInvoicePaid(
        parsedId.data,
        user.tenantId,
        parsed.data.paymentReference
      );
      return successResponse(invoice);
    },
    { requireRole: ['owner', 'manager', 'admin'], rateLimit: true }
  );
}
