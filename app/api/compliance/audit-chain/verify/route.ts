/**
 * Audit hash chain verification API for hub operators.
 * GET /api/compliance/audit-chain/verify?fromId=&toId=
 * Location: app/api/compliance/audit-chain/verify/route.ts
 *
 * Response: { data: ChainVerificationResult }
 */

import { NextRequest } from 'next/server';
import { z } from 'zod';
import {
  withApiAuth,
  errorResponse,
  successResponse,
} from '@/lib/utils/api-helpers';
import { auditHashService } from '@/lib/compliance/AuditHashService';
import {
  assertHubComplianceAccess,
  SOC2_HUB_ROLES,
} from '@/lib/compliance/soc2/hub-compliance-access';

const verifyQuerySchema = z.object({
  fromId: z.string().uuid().optional(),
  toId: z.string().uuid().optional(),
});

export async function GET(req: NextRequest) {
  return withApiAuth(
    req,
    async (request, user) => {
      const hubDenied = assertHubComplianceAccess(user);
      if (hubDenied) return hubDenied;

      if (!user.tenantId) {
        return errorResponse('Tenant context required', 400, 'MISSING_TENANT');
      }

      const url = new URL(request.url);
      const parsed = verifyQuerySchema.safeParse({
        fromId: url.searchParams.get('fromId') || undefined,
        toId: url.searchParams.get('toId') || undefined,
      });

      if (!parsed.success) {
        return errorResponse('Invalid query parameters', 400, 'VALIDATION_ERROR', {
          issues: parsed.error.flatten().fieldErrors,
        });
      }

      const result = await auditHashService.verifyChain(
        user.tenantId,
        parsed.data.fromId,
        parsed.data.toId
      );

      return successResponse(result);
    },
    { requireRole: [...SOC2_HUB_ROLES], rateLimit: true }
  );
}
