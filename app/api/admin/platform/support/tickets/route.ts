/**
 * Platform support tickets — list (platform admin only)
 * GET /api/admin/platform/support/tickets?status=&priority=
 * Response: { data: { tickets: SupportTicketListItem[] } }
 */

import { NextRequest, NextResponse } from 'next/server';
import { withPlatformAdminAuth } from '@/lib/auth/with-platform-admin-auth';
import { SupportTicketService } from '@/lib/services/platform/SupportTicketService';
import { securityLogger } from '@/lib/utils/security-logger';

export async function GET(request: NextRequest) {
  return withPlatformAdminAuth(request, async (req) => {
    try {
      const { searchParams } = new URL(req!.url);
      const status = searchParams.get('status') ?? undefined;
      const priority = searchParams.get('priority') ?? undefined;

      const service = new SupportTicketService();
      const tickets = await service.listTickets({ status, priority });

      return NextResponse.json({ data: { tickets } });
    } catch (error) {
      securityLogger.error('[GET /api/admin/platform/support/tickets]', error);
      return NextResponse.json({ error: 'Failed to load tickets' }, { status: 500 });
    }
  });
}
