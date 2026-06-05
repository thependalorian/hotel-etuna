/**
 * Escalate support ticket to Buffr internal engineering queue (no Linear).
 * POST /api/admin/platform/support/tickets/[id]/escalate
 * Location: app/api/admin/platform/support/tickets/[id]/escalate/route.ts
 */

import { NextRequest, NextResponse } from 'next/server';
import { requirePlatformAdmin } from '@/lib/auth/platform-admin';
import { recordAuditTrail } from '@/lib/compliance/record-audit';
import { escalateSupportTicketInternally } from '@/lib/integrations/internal-support-escalation';
import { SupportTicketService } from '@/lib/services/platform/SupportTicketService';
import { captureServerException } from '@/lib/monitoring/posthog-server';
import { securityLogger } from '@/lib/utils/security-logger';

type RouteContext = { params: Promise<{ id: string }> };

export async function POST(request: NextRequest, context: RouteContext) {
  try {
    const admin = await requirePlatformAdmin();
    const { id } = await context.params;
    const service = new SupportTicketService();
    const ticket = await service.getTicketWithMeta(id);
    if (!ticket) {
      return NextResponse.json({ error: 'Ticket not found' }, { status: 404 });
    }

    if (ticket.linear_issue_url) {
      return NextResponse.json({
        data: {
          alreadyLinked: true,
          escalation_ref: ticket.linear_issue_id,
          escalation_url: ticket.linear_issue_url,
        },
      });
    }

    const created = await escalateSupportTicketInternally({
      ticketId: id,
      subject: ticket.subject,
      tenantName: ticket.tenant_name,
      priority: ticket.priority,
    });

    await service.attachLinearIssue(id, created.identifier, created.url);

    await recordAuditTrail({
      tenantId: admin.tenantId ?? null,
      userId: admin.id,
      action: 'support_ticket_escalated',
      resourceType: 'support_tickets',
      resourceId: id,
      newValues: { escalation_ref: created.identifier, escalation_url: created.url },
      request,
    });

    return NextResponse.json({
      data: {
        escalation_ref: created.identifier,
        escalation_url: created.url,
        identifier: created.identifier,
      },
    });
  } catch (err) {
    securityLogger.error('[POST support ticket /escalate]', err);
    await captureServerException(err, 'platform-admin-support-escalate', {
      route: '/api/admin/platform/support/tickets/[id]/escalate',
    });
    const message = err instanceof Error ? err.message : 'Escalation failed';
    const status = message.includes('Unauthorized') ? 403 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
