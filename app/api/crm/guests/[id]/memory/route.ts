/**
 * @fileoverview API route //api/crm/guests/[id]/memory
 * Location: /app/api/crm/guests/[id]/memory/route.ts
 */

/**
 * CRM guest memory bundle — graph edges, facts, optional Mem0 lines, marketing insights
 *
 * Purpose: Power guest CRM panel; POST adds a staff fact row (Sofia prompt augmentation).
 * GET response shape: `{ data: { facts, edges, mem0Lines, insights } }`.
 * Location: app/api/crm/guests/[id]/memory/route.ts
 */

import { NextRequest } from 'next/server';
import * as z from 'zod';
import { withApiAuth, errorResponse, successResponse } from '@/lib/utils/api-helpers';
import { CrmGraphMemoryService } from '@/lib/services/crm/CrmGraphMemoryService';
import { GuestService } from '@/lib/services/booking/GuestService';
import { getGuestCrmInsights } from '@/lib/services/crm/crmGuestInsights';
import { mem0ListMemoriesForUser, mem0UserId, isMem0Configured } from '@/lib/integrations/mem0';
import { AppError } from '@/lib/utils/errors';
import { isValidEntityId } from '@/lib/validation/entity-ids';

const graph = new CrmGraphMemoryService();
const guestService = new GuestService();

const postFactSchema = z.object({
  factText: z.string().min(1).max(8000),
  source: z.string().max(32).optional(),
});

export async function GET(
  request: NextRequest,
  ctx: { params: Promise<{ id: string }> }
) {
  const { id: guestId } = await ctx.params;

  if (!isValidEntityId(guestId)) {
    return errorResponse('Invalid guest id', 400, 'INVALID_ID');
  }

  return withApiAuth(
    request,
    async (_req, user) => {
      if (!user.tenantId) {
        return errorResponse('Tenant ID is required', 400, 'MISSING_TENANT_ID');
      }

      try {
        await guestService.getGuestById(guestId, user.tenantId);
      } catch (e) {
        if (e instanceof AppError && e.statusCode === 404) {
          return errorResponse('Guest not found', 404, 'GUEST_NOT_FOUND');
        }
        throw e;
      }

      const [facts, edges, insights] = await Promise.all([
        graph.listFactsForGuest(user.tenantId, guestId),
        graph.listEdgesForGuest(user.tenantId, guestId),
        getGuestCrmInsights(user.tenantId, guestId),
      ]);

      let mem0Lines: string[] = [];
      if (isMem0Configured()) {
        mem0Lines = await mem0ListMemoriesForUser(mem0UserId(user.tenantId, guestId), 10);
      }

      /** @example `{ data: { facts, edges, mem0Lines, insights } }` */
      return successResponse({
        facts,
        edges,
        mem0Lines,
        insights: insights ?? null,
      });
    },
    { requireRole: ['owner', 'manager', 'admin'], rateLimit: true }
  );
}

export async function POST(
  request: NextRequest,
  ctx: { params: Promise<{ id: string }> }
) {
  const { id: guestId } = await ctx.params;

  if (!isValidEntityId(guestId)) {
    return errorResponse('Invalid guest id', 400, 'INVALID_ID');
  }

  return withApiAuth(
    request,
    async (req, user) => {
      if (!user.tenantId) {
        return errorResponse('Tenant ID is required', 400, 'MISSING_TENANT_ID');
      }

      try {
        await guestService.getGuestById(guestId, user.tenantId);
      } catch (e) {
        if (e instanceof AppError && e.statusCode === 404) {
          return errorResponse('Guest not found', 404, 'GUEST_NOT_FOUND');
        }
        throw e;
      }

      let body: unknown;
      try {
        body = await req.json();
      } catch {
        return errorResponse('Invalid JSON body', 400, 'INVALID_JSON');
      }

      const parsed = postFactSchema.safeParse(body);
      if (!parsed.success) {
        return errorResponse('Invalid request body', 400, 'VALIDATION_ERROR', parsed.error.flatten());
      }

      const factId = await graph.addGuestFact({
        tenantId: user.tenantId,
        guestId,
        factText: parsed.data.factText,
        source: parsed.data.source ?? 'staff',
      });

      if (!factId) {
        return errorResponse('Failed to save fact', 500, 'FACT_CREATE_FAILED');
      }

      return successResponse({ id: factId }, 201);
    },
    { requireRole: ['owner', 'manager', 'admin'], rateLimit: true }
  );
}
