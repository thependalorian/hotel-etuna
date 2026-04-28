/**
 * Tenant support ticket creation and listing
 *
 * Purpose: Allow authenticated tenant users to open support tickets without using
 * platform-admin-only routes.
 * Location: /app/api/support/tickets/route.ts
 */

import { NextRequest } from 'next/server';
import { z } from 'zod';
import { withApiAuth, errorResponse, successResponse } from '@/lib/utils/api-helpers';
import { recordAuditTrail } from '@/lib/compliance/record-audit';
import { SupportTicketService } from '@/lib/services/platform/SupportTicketService';

const createSupportTicketSchema = z.object({
  subject: z.string().trim().min(3).max(500),
  description: z.string().trim().min(10).max(5000),
  priority: z.enum(['low', 'medium', 'high', 'urgent']).optional(),
  category: z.string().trim().min(2).max(100).optional(),
});

const service = new SupportTicketService();

export async function GET(request: NextRequest) {
  return withApiAuth(
    request,
    async (_req, user) => {
      if (!user.tenantId) {
        return errorResponse('Tenant ID is required', 400, 'MISSING_TENANT_ID');
      }

      const tickets = await service.listTicketsForUser(user.tenantId, user.id);
      return successResponse({ tickets });
    },
    { rateLimit: true }
  );
}

export async function POST(request: NextRequest) {
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

      const parsed = createSupportTicketSchema.safeParse(body);
      if (!parsed.success) {
        return errorResponse(
          'Invalid input',
          400,
          'VALIDATION_ERROR',
          parsed.error.flatten().fieldErrors
        );
      }

      const ticket = await service.createTicket({
        tenantId: user.tenantId,
        userId: user.id,
        ...parsed.data,
      });

      await recordAuditTrail({
        tenantId: user.tenantId,
        userId: user.id,
        action: 'support.ticket.created',
        resourceType: 'support_ticket',
        resourceId: ticket.id,
        newValues: {
          subject: ticket.subject,
          priority: ticket.priority,
          category: ticket.category,
          status: ticket.status,
        },
        request,
      });

      return successResponse({ ticket }, 201);
    },
    { rateLimit: true }
  );
}
