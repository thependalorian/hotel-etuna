/**
 * SOC 2 audit agents — backward-compatible alias for full report.
 * GET /api/compliance/soc2/audit?from=ISO&to=ISO
 * Prefer: GET /api/compliance/soc2?action=full-report&from=&to=
 */

import { NextRequest } from 'next/server';
import {
  withApiAuth,
  errorResponse,
  successResponse,
} from '@/lib/utils/api-helpers';
import { soc2ComplianceService } from '@/lib/compliance/soc2/Soc2ComplianceService';
import {
  assertHubComplianceAccess,
  defaultSoc2Period,
  parseSoc2DateParam,
  SOC2_HUB_ROLES,
} from '@/lib/compliance/soc2/hub-compliance-access';

export async function GET(request: NextRequest) {
  return withApiAuth(
    request,
    async (req, user) => {
      const hubDenied = assertHubComplianceAccess(user);
      if (hubDenied) return hubDenied;

      const defaults = defaultSoc2Period();
      const from = parseSoc2DateParam(req.nextUrl.searchParams.get('from'), defaults.from);
      const to = parseSoc2DateParam(req.nextUrl.searchParams.get('to'), defaults.to);

      if (from > to) {
        return errorResponse('from must be before to', 400, 'VALIDATION_ERROR');
      }

      const report = await soc2ComplianceService.runComplianceAssessment(
        from.toISOString().slice(0, 10),
        to.toISOString().slice(0, 10)
      );

      return successResponse(report);
    },
    { rateLimit: true, requireRole: [...SOC2_HUB_ROLES] }
  );
}
