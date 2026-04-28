/**
 * Escalate support ticket to Linear (issue tracking)
 *
 * POST /api/admin/platform/support/tickets/[id]/linear
 * Requires LINEAR_API_KEY + LINEAR_TEAM_ID. Stores issue id/url on support_tickets.
 * Location: app/api/admin/platform/support/tickets/[id]/linear/route.ts
 */

import { NextRequest, NextResponse } from 'next/server';
import { getCurrentPlatformAdmin, isPlatformAdmin } from '@/lib/auth/platform-admin';
import { SupportTicketService } from '@/lib/services/platform/SupportTicketService';
import { enforcePlatformAdminRateLimit } from '@/lib/compliance/with-admin-rate-limit';
import { createLinearIssueForSupportTicket, isLinearConfigured } from '@/lib/integrations/linear';
import { recordAuditTrail } from '@/lib/compliance/record-audit';
import { AuditActions, AuditResourceTypes } from '@/lib/compliance/regulatory-context';
import { captureServerException } from '@/lib/monitoring/posthog-server';

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const user = await getCurrentPlatformAdmin();
    if (!user || !isPlatformAdmin(user)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const limited = await enforcePlatformAdminRateLimit(request, user.id);
    if (limited) {
      return limited;
    }

    if (!isLinearConfigured()) {
      return NextResponse.json(
        { error: 'Linear is not configured (LINEAR_API_KEY, LINEAR_TEAM_ID)' },
        { status: 503 }
      );
    }

    const { id } = await params;
    const service = new SupportTicketService();
    const ticket = await service.getTicketWithMeta(id);
    if (!ticket) {
      return NextResponse.json({ error: 'Ticket not found' }, { status: 404 });
    }

    if (ticket.linear_issue_url) {
      return NextResponse.json({
        data: { alreadyLinked: true, linear_issue_url: ticket.linear_issue_url },
      });
    }

    const created = await createLinearIssueForSupportTicket({
      ticketId: id,
      subject: ticket.subject,
      description: ticket.description,
      priority: ticket.priority,
    });

    await service.attachLinearIssue(id, created.id, created.url);

    await recordAuditTrail({
      tenantId: ticket.tenant_id,
      userId: user.id,
      action: AuditActions.SUPPORT_TICKET_ADMIN_REPLY,
      resourceType: AuditResourceTypes.SUPPORT_TICKET,
      resourceId: id,
      newValues: { linear_issue_id: created.id, linear_issue_url: created.url },
      request,
    });

    return NextResponse.json({
      data: { linear_issue_id: created.id, linear_issue_url: created.url, identifier: created.identifier },
    });
  } catch (err) {
    console.error('[POST support ticket /linear]', err);
    await captureServerException(err, 'platform-admin-support-linear', {
      route: '/api/admin/platform/support/tickets/[id]/linear',
    });
    const message = err instanceof Error ? err.message : 'Linear escalation failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
