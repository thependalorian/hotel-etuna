/**
 * Consumer rights request status (ETA-oriented workflow)
 *
 * Purpose: Validated transitions for consumer_rights_requests
 * Location: /app/api/compliance/consumer-rights/[id]/status/route.ts
 */

import { NextRequest } from 'next/server';
import { withApiAuth, errorResponse, successResponse } from '@/lib/utils/api-helpers';
import { RegulatoryLifecycleService } from '@/lib/services/compliance/RegulatoryLifecycleService';
import { entityStatusTransitionSchema } from '@/lib/utils/validation';
import { AppError } from '@/lib/utils/errors';
import { recordAuditTrail } from '@/lib/compliance/record-audit';

const regulatoryService = new RegulatoryLifecycleService();

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  return withApiAuth(
    request,
    async (req, user) => {
      if (!user.tenantId) {
        return errorResponse('Tenant ID is required', 400, 'MISSING_TENANT_ID');
      }
      let body: unknown;
      try {
        body = await request.json();
      } catch {
        return errorResponse('Invalid JSON', 400, 'INVALID_JSON');
      }
      const parsed = entityStatusTransitionSchema.safeParse(body);
      if (!parsed.success) {
        return errorResponse(
          'Invalid input',
          400,
          'VALIDATION_ERROR',
          parsed.error.flatten().fieldErrors
        );
      }
      try {
        const row = await regulatoryService.transitionConsumerRightsRequest(
          user.tenantId,
          id,
          parsed.data.status
        );
        await recordAuditTrail({
          tenantId: user.tenantId,
          userId: user.id,
          action: 'compliance.consumer_rights.status_changed',
          resourceType: 'consumer_rights_request',
          resourceId: id,
          newValues: {
            status: row.status,
            requestedStatus: parsed.data.status,
          },
          request,
        });
        return successResponse({
          consumerRightsRequest: row,
          workflow: {
            kind: 'consumer_rights_lifecycle',
            targetStatus: parsed.data.status,
          },
        });
      } catch (e) {
        if (e instanceof AppError) {
          return errorResponse(e.message, e.statusCode, 'CONSUMER_RIGHTS_TRANSITION');
        }
        throw e;
      }
    },
    { requireRole: ['owner', 'manager', 'admin'], rateLimit: true }
  );
}
