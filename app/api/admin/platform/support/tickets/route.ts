/**
 * Platform support tickets — list (platform admin only)
 * GET /api/admin/platform/support/tickets?status=&priority=
 * Response: { data: { tickets: SupportTicketListItem[] } }
 */

import { NextRequest, NextResponse } from 'next/server';
import { getCurrentPlatformAdmin, isPlatformAdmin } from '@/lib/auth/platform-admin';
import { SupportTicketService } from '@/lib/services/platform/SupportTicketService';
import { enforcePlatformAdminRateLimit } from '@/lib/compliance/with-admin-rate-limit';
import { securityLogger } from '@/lib/utils/security-logger.client';

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentPlatformAdmin();
    if (!user || !isPlatformAdmin(user)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const limited = await enforcePlatformAdminRateLimit(request, user.id);
    if (limited) {
      return limited;
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') ?? undefined;
    const priority = searchParams.get('priority') ?? undefined;

    const service = new SupportTicketService();
    const tickets = await service.listTickets({ status, priority });

    return NextResponse.json({ data: { tickets } });
  } catch (error) {
    securityLogger.error('[GET /api/admin/platform/support/tickets]', error);
    return NextResponse.json({ error: 'Failed to load tickets' }, { status: 500 });
  }
}
