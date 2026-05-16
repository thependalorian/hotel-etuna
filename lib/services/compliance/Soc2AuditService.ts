/**
 * Soc2AuditService — orchestrates SOC 2 audit agents for Hotel Etuna readiness.
 * Location: lib/services/compliance/Soc2AuditService.ts
 */

import {
  HOTEL_ETUNA_SOC2_SCOPE,
  SOC2_FRAMEWORK_REFERENCE,
} from '@/lib/compliance/soc2/control-catalog';
import { runAllSoc2Agents } from '@/lib/compliance/soc2/agents/run-soc2-agents';
import type { Soc2AuditReport, Soc2ControlStatus } from '@/lib/compliance/soc2/types';

function summarizeStatus(controls: Soc2AuditReport['controls']) {
  const summary = { compliant: 0, partial: 0, gap: 0, manual: 0, inherited: 0 };
  for (const c of controls) {
    summary[c.status] += 1;
  }
  return summary;
}

function overallScore(summary: ReturnType<typeof summarizeStatus>, total: number): number {
  if (total === 0) return 0;
  const weighted =
    summary.compliant * 100 +
    summary.inherited * 90 +
    summary.partial * 60 +
    summary.manual * 40;
  return Math.round(weighted / total);
}

export class Soc2AuditService {
  /**
   * Run all SOC 2 audit agents and return a Type I-style readiness report.
   * For Type II, re-run across the audit period and export evidence each month.
   */
  async runAudit(
    tenantId: string | null,
    from: Date,
    to: Date
  ): Promise<Soc2AuditReport> {
    const agents = await runAllSoc2Agents(tenantId, from, to);
    const controls = agents.flatMap((a) => a.controls);
    const summary = summarizeStatus(controls);

    const typeReadiness =
      summary.gap === 0 && summary.manual === 0
        ? 'Type I design readiness: strong'
        : summary.gap <= 3
          ? 'Type I design readiness: moderate — remediate gaps before CPA'
          : 'Type I design readiness: early — complete gap remediation roadmap';

    return {
      organization: HOTEL_ETUNA_SOC2_SCOPE.organization,
      system: HOTEL_ETUNA_SOC2_SCOPE.system,
      frameworkReference: SOC2_FRAMEWORK_REFERENCE,
      trustCategories: ['security', 'availability', 'confidentiality'],
      period: { from: from.toISOString(), to: to.toISOString() },
      subserviceOrganizations: [
        {
          name: 'Vercel',
          role: 'Application hosting',
          cuecNote: 'Review Vercel SOC 2; HTTPS, deployment logs, DDoS',
        },
        {
          name: 'Neon',
          role: 'PostgreSQL database',
          cuecNote: 'Review Neon SOC 2; backup, encryption at rest, access',
        },
        {
          name: 'Adumo',
          role: 'Card payment gateway',
          cuecNote: 'PCI-DSS / merchant agreement; settlement to Etuna Nedbank',
        },
      ],
      overallScorePercent: overallScore(summary, controls.length),
      summary,
      agents,
      controls,
      disclaimer: `Automated readiness assessment only — not a CPA opinion. ${typeReadiness}. Type II requires 6–12 months of operating effectiveness evidence (logs, access reviews, incidents, vendor SOC reviews). Benchmark controls: NayaOne SOC 2 Type II (Security, Availability, Confidentiality). In-scope: ${HOTEL_ETUNA_SOC2_SCOPE.inScope.join('; ')}.`,
    };
  }

  /** Controls that must be remediated before enterprise procurement / Type I */
  getPriorityGaps(report: Soc2AuditReport): Soc2AuditReport['controls'] {
    return report.controls.filter((c) => c.status === 'gap' || c.status === 'manual');
  }
}
