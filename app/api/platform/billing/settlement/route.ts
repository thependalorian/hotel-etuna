/**
 * GET settlement bank profiles (property + Buffr billing).
 * Location: app/api/platform/billing/settlement/route.ts
 */

import { NextRequest } from 'next/server';
import { withApiAuth, errorResponse, successResponse } from '@/lib/utils/api-helpers';
import { SettlementAccountService } from '@/lib/services/billing/SettlementAccountService';
import { settlementProfileForParty } from '@/lib/platform/settlement-accounts';

export async function GET(request: NextRequest) {
  return withApiAuth(
    request,
    async (_req, user) => {
      if (!user.tenantId) {
        return errorResponse('Tenant required', 400, 'MISSING_TENANT_ID');
      }

      const service = new SettlementAccountService();
      try {
        const profiles = await service.listForTenant(user.tenantId);
        return successResponse({ profiles });
      } catch {
        return successResponse({
          profiles: [
            settlementProfileForParty('property'),
            settlementProfileForParty('platform'),
          ],
        });
      }
    },
    { requireRole: ['owner', 'manager', 'admin', 'staff'], rateLimit: true }
  );
}
