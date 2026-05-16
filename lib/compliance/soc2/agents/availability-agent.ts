/**
 * SOC 2 agent — availability, SLA, backups, reconciliation.
 * Location: lib/compliance/soc2/agents/availability-agent.ts
 */

import { db, cashReconciliations } from '@/lib/db';
import { sql, gte, lte, and } from 'drizzle-orm';
import { existsSync } from 'fs';
import { join } from 'path';
import type { Soc2AgentRunResult, Soc2ControlResult } from '../types';
import { pickAgentControls, mergeControl } from './shared';
import { scoreControls } from '../control-matrix';

export async function runAvailabilityAgent(
  base: Soc2ControlResult[],
  period: { from: Date; to: Date }
): Promise<Soc2AgentRunResult> {
  let controls = pickAgentControls(base, 'availability');

  const reconStats = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(cashReconciliations)
    .where(
      and(
        gte(cashReconciliations.createdAt, period.from),
        lte(cashReconciliations.createdAt, period.to)
      )
    );

  const hasSlaDoc = existsSync(
    join(process.cwd(), 'docs/BUFFR_FINANCIAL_SERVICES_PROPOSAL_AND_SLA.md')
  );
  const hasUptimeService = existsSync(
    join(process.cwd(), 'lib/services/security/UptimeMonitoringService.ts')
  );

  controls = mergeControl(controls, 'A1.1', {
    status: hasSlaDoc ? 'partial' : 'gap',
    evidence: [
      hasSlaDoc ? 'BUFFR_FINANCIAL_SERVICES_PROPOSAL_AND_SLA.md — 99.5% uptime target' : 'No SLA doc',
      hasUptimeService ? 'UptimeMonitoringService.ts present' : 'Uptime service optional',
    ],
    gaps: ['Customer-facing SLA page / status page not verified'],
    remediation: ['Publish status.hoteletuna.com or Vercel status integration'],
  });

  controls = mergeControl(controls, 'A1.2', {
    status: 'inherited',
    evidence: [
      'Neon PostgreSQL — PITR / backups via subservice (carve-out like NayaOne/AWS)',
      'Vercel deployment rollback available',
    ],
    gaps: [
      'Quarterly restore test not logged in platform',
      'DR runbook not in repo',
    ],
    remediation: [
      'Annual review of Neon SOC 2 / security report',
      'Document quarterly restore test in compliance/evidence/',
    ],
  });

  controls = mergeControl(controls, 'A1.3', {
    status: (reconStats[0]?.count ?? 0) > 0 ? 'partial' : 'gap',
    evidence: [
      `cash_reconciliations in period: ${reconStats[0]?.count ?? 0}`,
      '/payments/reconciliation UI',
    ],
    gaps: ['Adumo settlement vs Nedbank reconciliation not fully automated'],
    remediation: ['Extend reconciliation report to include card settlements'],
  });

  return {
    agentId: 'availability',
    agentName: 'Availability & Operations',
    controls,
    scorePercent: scoreControls(controls),
    ranAt: new Date().toISOString(),
  };
}
