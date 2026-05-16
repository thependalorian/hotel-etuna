/**
 * SOC 2 agent — confidentiality, encryption, payment data handling.
 * Location: lib/compliance/soc2/agents/confidentiality-agent.ts
 */

import { db, paymentSecurityAudit } from '@/lib/db';
import { sql, gte, lte, and } from 'drizzle-orm';
import type { Soc2AgentRunResult, Soc2ControlResult } from '../types';
import { pickAgentControls, mergeControl } from './shared';
import { scoreControls } from '../control-matrix';

export async function runConfidentialityAgent(
  base: Soc2ControlResult[],
  period: { from: Date; to: Date }
): Promise<Soc2AgentRunResult> {
  let controls = pickAgentControls(base, 'confidentiality');

  const payRows = await db
    .select({
      overallSecurityPassed: paymentSecurityAudit.overallSecurityPassed,
    })
    .from(paymentSecurityAudit)
    .where(
      and(
        gte(paymentSecurityAudit.createdAt, period.from),
        lte(paymentSecurityAudit.createdAt, period.to)
      )
    );

  const total = payRows.length;
  const passed = payRows.filter((r) => r.overallSecurityPassed).length;

  controls = mergeControl(controls, 'C1.1', {
    status: 'compliant',
    evidence: [
      'HTTPS enforced on Vercel production',
      'Session cookies httpOnly + SameSite per TASK.md',
      'Adumo Virtual — card data on hosted page (SAQ A scope reduction)',
    ],
    gaps: [],
  });

  controls = mergeControl(controls, 'C1.2', {
    status: 'inherited',
    evidence: [
      'Encryption at rest: Neon + Vercel (subservice organization controls)',
      'Review Vercel & Neon annual SOC 2 reports (CUEC)',
    ],
    gaps: ['CUEC mapping spreadsheet not in repo'],
    remediation: ['Maintain vendor_soc_reports/ with Neon, Vercel, Adumo attestations'],
  });

  controls = mergeControl(controls, 'C1.3', {
    status: total > 0 && passed / total >= 0.9 ? 'partial' : total === 0 ? 'manual' : 'gap',
    evidence: [
      `payment_security_audit: ${passed}/${total} passed overall security in period`,
      'PSD-12 / PSD-4 flags on payment_security_audit table',
    ],
    gaps: total === 0 ? ['No payment audits in period — run card payment tests'] : [],
    remediation: ['Retain payment_security_audit 7 years per schema comment'],
  });

  return {
    agentId: 'confidentiality',
    agentName: 'Confidentiality & Data Protection',
    controls,
    scorePercent: scoreControls(controls),
    ranAt: new Date().toISOString(),
  };
}
