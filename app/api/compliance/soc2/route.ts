/**
 * SOC 2 Compliance API — status and CPA evidence export (hub admin).
 * GET /api/compliance/soc2?action=export|status|full-report
 * Audit agents: GET /api/compliance/soc2/audit
 * Location: app/api/compliance/soc2/route.ts
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  withApiAuth,
  errorResponse,
  successResponse,
} from '@/lib/utils/api-helpers';
import { soc2ComplianceService } from '@/lib/compliance/soc2/Soc2ComplianceService';
import {
  assertHubComplianceAccess,
  defaultSoc2Period,
  SOC2_HUB_ROLES,
} from '@/lib/compliance/soc2/hub-compliance-access';
import { z } from 'zod';

const soc2QuerySchema = z.object({
  action: z.enum(['status', 'export', 'full-report']).default('status'),
  periodStart: z.string().optional(),
  periodEnd: z.string().optional(),
});

function periodStrings(): { periodStart: string; periodEnd: string } {
  const { from, to } = defaultSoc2Period();
  const sixMonthsAgo = new Date(to);
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
  return {
    periodStart: sixMonthsAgo.toISOString().slice(0, 10),
    periodEnd: to.toISOString().slice(0, 10),
  };
}

export async function GET(req: NextRequest) {
  return withApiAuth(
    req,
    async (request, user) => {
      const hubDenied = assertHubComplianceAccess(user);
      if (hubDenied) return hubDenied;

      const url = new URL(request.url);
      const params = soc2QuerySchema.parse({
        action: url.searchParams.get('action') || 'status',
        periodStart: url.searchParams.get('periodStart') || undefined,
        periodEnd: url.searchParams.get('periodEnd') || undefined,
      });

      const defaults = periodStrings();
      const periodStart = params.periodStart || defaults.periodStart;
      const periodEnd = params.periodEnd || defaults.periodEnd;

      if (params.action === 'status') {
        const report = await soc2ComplianceService.runComplianceAssessment(
          periodStart,
          periodEnd
        );
        return successResponse({
          overallScorePercent: report.overallScorePercent,
          summary: report.summary,
          period: report.period,
          topGaps: report.controls
            .filter((c) => c.status === 'gap')
            .slice(0, 5)
            .map((c) => ({
              controlId: c.controlId,
              title: c.title,
              tscReference: c.tscReference,
              gaps: c.gaps,
              remediation: c.remediation,
            })),
          agentScores: report.agents.map((a) => ({
            agentName: a.agentName,
            scorePercent: a.scorePercent,
          })),
        });
      }

      if (params.action === 'full-report') {
        const report = await soc2ComplianceService.runComplianceAssessment(
          periodStart,
          periodEnd
        );
        return successResponse(report);
      }

      const evidencePackage = await soc2ComplianceService.exportEvidencePackage(
        periodStart,
        periodEnd
      );

      return NextResponse.json(evidencePackage, {
        headers: {
          'Content-Disposition': `attachment; filename="soc2-evidence-${periodStart}-to-${periodEnd}.json"`,
        },
      });
    },
    { requireRole: [...SOC2_HUB_ROLES], rateLimit: true }
  );
}
