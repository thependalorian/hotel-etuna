/**
 * F&B Print Job Status API
 *
 * Purpose: Update kitchen ticket print job status (kanban drag / staff actions).
 * Location: /app/api/fnb/print-jobs/[id]/status/route.ts
 *
 * PATCH /api/fnb/print-jobs/[id]/status
 * Body: { propertyId, status, errorMessage? }
 */

import { NextRequest } from 'next/server';
import { z } from 'zod';
import {
  withApiAuth,
  errorResponse,
  successResponse,
  validateJsonBody,
} from '@/lib/utils/api-helpers';
import { fnbPrintDispatchService } from '@/lib/services/fnb/fnb-print-dispatch-service';

const STAFF_ROLES = ['owner', 'manager', 'admin', 'staff', 'kitchen', 'housekeeping_supervisor'];

const patchStatusSchema = z.object({
  propertyId: z.string().uuid(),
  status: z.enum(['pending', 'printing', 'printed', 'failed', 'cancelled']),
  errorMessage: z.string().max(500).optional(),
});

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  return withApiAuth(
    request,
    async (req, user) => {
      if (!user.tenantId) {
        return errorResponse('Tenant ID is required', 400, 'MISSING_TENANT_ID');
      }

      const { id } = await context.params;
      const body = await validateJsonBody(req, patchStatusSchema);

      await fnbPrintDispatchService.assertPropertyInTenant(body.propertyId, user.tenantId);

      const updated = await fnbPrintDispatchService.updateStatus(
        id,
        body.propertyId,
        body.status,
        body.errorMessage
      );

      return successResponse(updated);
    },
    { requireRole: STAFF_ROLES, rateLimit: true }
  );
}
