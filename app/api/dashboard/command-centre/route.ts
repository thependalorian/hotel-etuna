/**
 * @fileoverview API route GET /api/dashboard/command-centre
 * Location: /app/api/dashboard/command-centre/route.ts
 *
 * Returns today's live operational snapshot + the derived colour-coded alert feed for the
 * staff command centre. Polled by the UI for near-real-time refresh.
 */
import { NextRequest } from 'next/server';
import { withApiAuth, errorResponse, successResponse } from '@/lib/utils/api-helpers';
import { commandCentreService } from '@/lib/services/intelligence/CommandCentreService';
import { deriveCommandCentreAlerts } from '@/lib/services/intelligence/command-centre-alerts';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  return withApiAuth(
    request,
    async (_req, user) => {
      if (!user.tenantId) return errorResponse('Tenant ID is required', 400, 'MISSING_TENANT_ID');
      const propertyId = new URL(request.url).searchParams.get('propertyId') ?? undefined;
      const snapshot = await commandCentreService.getSnapshot({ tenantId: user.tenantId, propertyId });
      const alerts = deriveCommandCentreAlerts(snapshot);
      return successResponse({ snapshot, alerts });
    },
    { requireRole: ['owner', 'manager', 'admin', 'desk', 'staff'] },
  );
}
