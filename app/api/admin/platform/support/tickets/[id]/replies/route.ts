/**
 * Platform support ticket — admin reply
 * POST /api/admin/platform/support/tickets/[id]/replies
 * Body: { message: string }
 */

import { NextRequest, NextResponse } from 'next/server';
import { getCurrentPlatformAdmin, isPlatformAdmin } from '@/lib/auth/platform-admin';
import { SupportTicketService } from '@/lib/services/platform/SupportTicketService';
import { enforcePlatformAdminRateLimit } from '@/lib/compliance/with-admin-rate-limit';
import { recordAuditTrail } from '@/lib/compliance/record-audit';
import { AuditActions, AuditResourceTypes } from '@/lib/compliance/regulatory-context';

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

    const { id: ticketId } = await params;
    const body = await request.json();
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
      request,
    });

    return NextResponse.json({ data: { ok: true } });
  } catch (error) {
    console.error('[POST support reply]', error);
    return NextResponse.json({ error: 'Failed to save reply' }, { status: 500 });
  }
}
