/**
 * Platform support ticket — update status
 * PATCH /api/admin/platform/support/tickets/[id]
 * Body: { status: string }
 */

import { NextRequest, NextResponse } from 'next/server';
import { getCurrentPlatformAdmin, isPlatformAdmin } from '@/lib/auth/platform-admin';
import { SupportTicketService } from '@/lib/services/platform/SupportTicketService';
import { enforcePlatformAdminRateLimit } from '@/lib/compliance/with-admin-rate-limit';
import { recordAuditTrail } from '@/lib/compliance/record-audit';
import { AuditActions, AuditResourceTypes } from '@/lib/compliance/regulatory-context';
import { securityLogger } from '@/lib/utils/security-logger.client';

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const user = await getCurrentPlatformAdmin();
    if (!user || !isPlatformAdmin(user)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const limited = await enforcePlatformAdminRateLimit(request, user.id);
    if (limited) {
      return limited;
    }

    const { id } = await params;
    const body = await request.json();
    const status = typeof body?.status === 'string' ? body.status : '';

    const service = new SupportTicketService();
    const meta = await service.getTicketMeta(id);
    if (!meta) {
      return NextResponse.json({ error: 'Ticket not found' }, { status: 404 });
    }

    const previousStatus = meta.status;
    const updated = await service.updateStatus(id, status);

    if (!updated) {
      return NextResponse.json({ error: 'Ticket not found' }, { status: 404 });
    }

    await recordAuditTrail({
      tenantId: meta.tenantId,
      userId: user.id,
      action: AuditActions.SUPPORT_TICKET_STATUS_UPDATE,
      resourceType: AuditResourceTypes.SUPPORT_TICKET,
      resourceId: id,
      oldValues: { status: previousStatus },
      newValues: { status },
      request,
    });

    return NextResponse.json({ data: { ticket: updated } });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Update failed';
    if (message.startsWith('Invalid status') || message.startsWith('Invalid transition')) {
      return NextResponse.json({ error: message }, { status: 400 });
    }
    securityLogger.error('[PATCH support ticket]', error);
    return NextResponse.json({ error: 'Failed to update ticket' }, { status: 500 });
  }
}
