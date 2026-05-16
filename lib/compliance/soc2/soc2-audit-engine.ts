/**
 * SOC 2 audit engine — orchestrates agents and produces Type I / readiness report.
 * Location: lib/compliance/soc2/soc2-audit-engine.ts
 */

import { SOC2_AUDITOR_INTERVIEW_PROMPTS } from '@/lib/compliance/soc2/nayaone-tsc-framework';
import { soc2AuditOrchestrator } from '@/lib/compliance/soc2/Soc2AuditOrchestrator';
import type { Soc2AuditReport } from '@/lib/compliance/soc2/types';

/** Single audit path — delegates to Soc2AuditOrchestrator (control-matrix agents). */
export async function runSoc2Audit(input?: {
  from?: Date;
  to?: Date;
}): Promise<Soc2AuditReport> {
  const to = input?.to ?? new Date();
  const from =
    input?.from ?? new Date(to.getFullYear(), to.getMonth() - 3, to.getDate());

  const report = await soc2AuditOrchestrator.runAudit({
    periodFrom: from,
    periodTo: to,
  });

  const gapControls = report.controls.filter(
    (c) => c.status === 'gap' || c.status === 'partial'
  );
  const { summary, overallScorePercent } = report;

  return {
    ...report,
    executiveBullets: [
      `Readiness score: ${overallScorePercent}% (${summary.compliant} compliant, ${summary.partial} partial, ${summary.gap} gaps, ${summary.manual} manual, ${summary.inherited} inherited).`,
      'Minimum viable scope: Security (mandatory) + Availability + Confidentiality per NayaOne SOC 2 Type II reference.',
      gapControls.length > 0
        ? `Priority gaps: ${gapControls.slice(0, 5).map((c) => c.controlId).join(', ')}${gapControls.length > 5 ? '…' : ''}.`
        : 'No critical automated gaps detected in scoped controls.',
      'Type I: point-in-time design assessment. Type II: requires 6–12 months operating evidence (logs, access reviews, DR test).',
    ],
    auditorPrompts: SOC2_AUDITOR_INTERVIEW_PROMPTS,
  };
}
