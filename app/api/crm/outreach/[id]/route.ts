/**
 * @fileoverview API route //api/crm/outreach/[id]
 * Location: /app/api/crm/outreach/[id]/route.ts
 */

/**
 * CRM outreach touch — PATCH status (lifecycle-validated, consent-gated for scheduled/sent)
 *
 * Purpose: Move touches through `draft → scheduled → sent` / `cancelled` per `CRM_OUTREACH_TOUCH_TRANSITIONS`.
 * Response: `{ data: { ok, status } }` or `{ error }` via helpers.
 * Location: app/api/crm/outreach/[id]/route.ts
 */

import { NextRequest } from 'next/server';
import * as z from 'zod';
import { withApiAuth, errorResponse, successResponse } from '@/lib/utils/api-helpers';
import { CrmOutreachService } from '@/lib/services/crm/CrmOutreachService';
import { isValidEntityId } from '@/lib/validation/entity-ids';

const outreach = new CrmOutreachService();

const patchSchema = z.object({
  status: z.enum(['scheduled', 'sent', 'cancelled']),
});

export async function PATCH(
  request: NextRequest,
  ctx: { params: Promise<{ id: string }> }
) {
  const { id } = await ctx.params;

  if (!isValidEntityId(id)) {
    return errorResponse('Invalid touch id', 400, 'INVALID_ID');
  }

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
        return errorResponse('Invalid JSON body', 400, 'INVALID_JSON');
      }

      const parsed = patchSchema.safeParse(body);
      if (!parsed.success) {
        return errorResponse('Invalid request body', 400, 'VALIDATION_ERROR', parsed.error.flatten());
      }

      const result = await outreach.transitionStatus(user.tenantId, id, parsed.data.status);

      if (!result.ok) {
        return errorResponse(result.error || 'Transition failed', 400, 'TRANSITION_FAILED');
      }

      /** @example `{ data: { ok: true, status: string } }` */
      return successResponse({ ok: true, status: result.status });
    },
    { requireRole: ['owner', 'manager', 'admin'], rateLimit: true }
  );
}
