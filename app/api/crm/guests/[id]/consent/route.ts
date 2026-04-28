/**
 * CRM guest consent event API
 *
 * Purpose: Read and append marketing consent evidence for a tenant guest.
 * Location: /app/api/crm/guests/[id]/consent/route.ts
 */

import { NextRequest } from 'next/server';
import { z } from 'zod';
import { withApiAuth, errorResponse, successResponse } from '@/lib/utils/api-helpers';
import { recordAuditTrail } from '@/lib/compliance/record-audit';
import { CrmConsentService } from '@/lib/services/crm/CrmConsentService';
import { AppError } from '@/lib/utils/errors';

const consentUpdateSchema = z.object({
  marketingConsent: z.boolean(),
  source: z.string().trim().min(2).max(64).optional(),
  reason: z.string().trim().max(1000).optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

const service = new CrmConsentService();

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  return withApiAuth(
    request,
    async (_req, user) => {
      if (!user.tenantId) {
        return errorResponse('Tenant ID is required', 400, 'MISSING_TENANT_ID');
      }

      const events = await service.listEvents(user.tenantId, id);
      return successResponse({ events });
    },
    { requireRole: ['owner', 'manager', 'admin'], rateLimit: true }
  );
}

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  return withApiAuth(
    request,
    async (_req, user) => {
      if (!user.tenantId) {
        return errorResponse('Tenant ID is required', 400, 'MISSING_TENANT_ID');
      }

      let body: unknown;
      try {
        body = await request.json();
      } catch {
        return errorResponse('Invalid JSON', 400, 'INVALID_JSON');
      }

      const parsed = consentUpdateSchema.safeParse(body);
      if (!parsed.success) {
        return errorResponse(
          'Invalid input',
          400,
          'VALIDATION_ERROR',
          parsed.error.flatten().fieldErrors
        );
      }

      try {
        const event = await service.recordConsentChange({
          tenantId: user.tenantId,
          guestId: id,
          newMarketingConsent: parsed.data.marketingConsent,
          source: parsed.data.source ?? 'dashboard',
          reason: parsed.data.reason,
          changedByUserId: user.id,
          metadata: parsed.data.metadata,
        });

        await recordAuditTrail({
          tenantId: user.tenantId,
          userId: user.id,
          action: 'crm.guest.marketing_consent_changed',
          resourceType: 'guest',
          resourceId: id,
          oldValues: {
            marketingConsent: event.previousMarketingConsent,
          },
          newValues: {
            marketingConsent: event.newMarketingConsent,
            consentEventId: event.id,
            source: event.source,
          },
          request,
        });

        return successResponse({ event }, 201);
      } catch (error) {
        if (error instanceof AppError) {
          return errorResponse(error.message, error.statusCode, 'CONSENT_EVENT_ERROR');
        }
        throw error;
      }
    },
    { requireRole: ['owner', 'manager', 'admin'], rateLimit: true }
  );
}
