/**
 * @fileoverview API route //api/bookings/night-audit
 * Location: /app/api/bookings/night-audit/route.ts
 */

/**
 * Night audit API — run end-of-day hospitality audit for a property.
 *
 * POST /api/bookings/night-audit
 * Body: { propertyId: uuid, businessDate?: 'YYYY-MM-DD' }
 * Response: { data: NightAuditResult }
 *
 * Auth: owner | manager
 */

import { NextRequest } from 'next/server';
import { z } from 'zod';
import {
  withApiAuth,
  errorResponse,
  successResponse,
} from '@/lib/utils/api-helpers';
import { nightAuditService } from '@/lib/services/booking/NightAuditService';

const bodySchema = z.object({
  propertyId: z.string().uuid(),
  businessDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional(),
});

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

      const parsed = bodySchema.safeParse(body);
      if (!parsed.success) {
        return errorResponse('Invalid request body', 400, 'VALIDATION_ERROR', parsed.error.flatten());
      }

      const businessDate =
        parsed.data.businessDate ?? new Date().toISOString().slice(0, 10);

      const result = await nightAuditService.runAudit({
        propertyId: parsed.data.propertyId,
        tenantId: user.tenantId,
        businessDate,
        userId: user.id,
      });

      return successResponse(result, 201);
    },
    { rateLimit: true, requireRole: ['owner', 'manager'] }
  );
}
