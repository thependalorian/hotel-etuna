/**
 * SOC 2 agent — monitoring, audit retention, incident response evidence.
 * Location: lib/compliance/soc2/agents/monitoring-agent.ts
 */

import { db, auditTrail, systemLogs, bonIncidentReports } from '@/lib/db';
import { sql, gte, lte, and } from 'drizzle-orm';
import { existsSync } from 'fs';
import { join } from 'path';
import type { Soc2AgentRunResult, Soc2ControlResult } from '../types';
import { pickAgentControls, mergeControl } from './shared';
import { scoreControls } from '../control-matrix';

export async function runMonitoringAgent(
  base: Soc2ControlResult[],
  period: { from: Date; to: Date }
): Promise<Soc2AgentRunResult> {
  let controls = pickAgentControls(base, 'monitoring_incidents');

  const auditStats = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(auditTrail)
    .where(and(gte(auditTrail.timestamp, period.from), lte(auditTrail.timestamp, period.to)));

  const logStats = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(systemLogs)
    .where(
      and(gte(systemLogs.createdAt, period.from), lte(systemLogs.createdAt, period.to))
    );

  const bonStats = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(bonIncidentReports)
    .where(
      and(
        gte(bonIncidentReports.submissionDate, period.from),
        lte(bonIncidentReports.submissionDate, period.to)
      )
    );

  const hasBonService = existsSync(
    join(process.cwd(), 'lib/services/compliance/BonIncidentReportingService.ts')
  );
  const hasSecurityWorkflow = existsSync(join(process.cwd(), '.github/workflows/security-audit.yml'));

  controls = mergeControl(controls, 'CC7.1', {
    status: (auditStats[0]?.count ?? 0) > 0 ? 'partial' : 'gap',
    evidence: [
      `audit_trail rows in period: ${auditStats[0]?.count ?? 0}`,
      `system_logs rows in period: ${logStats[0]?.count ?? 0}`,
      'lib/compliance/record-audit.ts — operational audit helper',
    ],
    gaps: [
      '365-day retention policy not enforced in code (NayaOne ref 52)',
      'Central SIEM / Vercel log export to long-term store not automated',
    ],
    remediation: [
      'Configure Neon + Vercel log retention; archive audit_trail monthly',
      'Weekly npm audit workflow already in .github/workflows/security-audit.yml',
    ],
  });

  controls = mergeControl(controls, 'CC7.2', {
    status: hasBonService ? 'partial' : 'gap',
    evidence: [
      hasBonService ? 'BonIncidentReportingService.ts present' : 'BoN incident service missing',
      `bon_incident_reports in period: ${bonStats[0]?.count ?? 0}`,
      hasSecurityWorkflow ? 'GitHub security-audit workflow' : 'No CI security workflow',
    ],
    gaps: [
      'Formal IR playbook PDF not in repo',
      'Table-top exercise records not stored in platform',
    ],
    remediation: [
      'Add docs/compliance/INCIDENT_RESPONSE.md with severity matrix',
      'Log cybersecurity_incidents → bon_incident_reports for all P1/P2',
    ],
  });

  return {
    agentId: 'monitoring_incidents',
    agentName: 'Monitoring & Incidents',
    controls,
    scorePercent: scoreControls(controls),
    ranAt: new Date().toISOString(),
  };
}
