/**
 * Platform support ticket — admin reply
 * POST /api/admin/platform/support/tickets/[id]/replies
 * Body: { message: string }
 */

import { NextRequest, NextResponse } from 'next/server';
import { withPlatformAdminAuth } from '@/lib/auth/with-platform-admin-auth';
import { SupportTicketService } from '@/lib/services/platform/SupportTicketService';
import { recordAuditTrail } from '@/lib/compliance/record-audit';
import { AuditActions, AuditResourceTypes } from '@/lib/compliance/regulatory-context';
import { securityLogger } from '@/lib/utils/security-logger';

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  return withPlatformAdminAuth(request, async (req, user) => {
    try {
      const { id: ticketId } = await params;
      const body = await req!.json();
      const message = typeof body?.message === 'string' ? body.message.trim() : '';

      if (!message) {
        return NextResponse.json({ error: 'Message is required' }, { status: 400 });
      }

      const service = new SupportTicketService();
      const meta = await service.getTicketMeta(ticketId);
      if (!meta) {
        return NextResponse.json({ error: 'Ticket not found' }, { status: 404 });
      }

      const wasOpen = meta.status === 'open';
      await service.addAdminReply(ticketId, user.id, message);

      if (wasOpen) {
        await service.updateStatus(ticketId, 'in_progress');
      }

      await recordAuditTrail({
        tenantId: meta.tenantId,
        userId: user.id,
        action: AuditActions.SUPPORT_TICKET_ADMIN_REPLY,
        resourceType: AuditResourceTypes.SUPPORT_TICKET,
        resourceId: ticketId,
        newValues: {
          replyCharacterCount: message.length,
          statusAutoSetInProgress: wasOpen,
        },
        request: req!,
      });

      return NextResponse.json({ data: { ok: true } });
    } catch (error) {
      securityLogger.error('[POST support reply]', error);
      return NextResponse.json({ error: 'Failed to save reply' }, { status: 500 });
    }
  });
}
