/**
 * SOC 2 agent — monitoring, audit retention, incident response evidence.
 * Location: lib/compliance/soc2/agents/monitoring-agent.ts
 */

import { db, auditTrail, systemLogs, bonIncidentReports } from '@/lib/db';
import { sql, gte, lte, and } from 'drizzle-orm';
import { existsSync } from 'fs';
import { join } from 'path';
import {
  findLatestPgauditStatusPath,
  isLoggingCompliant,
  readLatestPgauditStatus,
} from '@/lib/compliance/pgaudit-evidence';
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
  const hasIrp = existsSync(join(process.cwd(), 'docs/compliance/INCIDENT_RESPONSE_PLAN.md'));
  const hasIrPolicy = existsSync(
    join(process.cwd(), 'docs/compliance/policies/INCIDENT_RESPONSE_POLICY.md')
  );
  const hasTabletopSchedule = existsSync(
    join(process.cwd(), 'docs/compliance/incidents/tabletop-2026-06-15.md')
  );
  const hasTabletopResults = existsSync(
    join(process.cwd(), 'compliance/evidence/incidents/tabletop-2026-06-15-results.md')
  );
  const pgauditStatus = readLatestPgauditStatus(process.cwd());
  const pgauditInstalled = pgauditStatus?.pgauditInstalled === true;
  const compensatingControls = pgauditStatus?.compensatingControls === true;
  const loggingCompliant = pgauditStatus ? isLoggingCompliant(pgauditStatus) : false;
  const pgauditEvidencePath = findLatestPgauditStatusPath(process.cwd());
  const pgauditEvidence = pgauditEvidencePath
    ? pgauditEvidencePath.replace(`${process.cwd()}/`, '')
    : 'compliance/evidence/YYYY-MM/pgaudit-status.json';

  const auditActive = (auditStats[0]?.count ?? 0) > 0;
  controls = mergeControl(controls, 'CC7.1', {
    status: auditActive && loggingCompliant ? 'partial' : auditActive ? 'partial' : 'gap',
    evidence: [
      `audit_trail rows in period: ${auditStats[0]?.count ?? 0}`,
      `system_logs rows in period: ${logStats[0]?.count ?? 0}`,
      'lib/compliance/record-audit.ts — operational audit helper',
      pgauditInstalled
        ? `pgAudit enabled — ${pgauditEvidence}`
        : compensatingControls
          ? `IMP-01 compensating controls — ${pgauditEvidence}`
          : 'pgAudit not confirmed — run npm run verify:pgaudit',
      'scripts/compliance/export-audit-trail.ts — monthly archive',
    ],
    gaps: loggingCompliant
      ? ['365-day Vercel log export to long-term store not fully automated']
      : [
          'pgAudit / compensating controls not verified (IMP-01)',
          '365-day retention policy not fully automated in code',
        ],
    remediation: loggingCompliant
      ? ['Archive audit_trail monthly via export-monthly-evidence.ts']
      : ['Run npm run verify:pgaudit', 'Archive audit_trail monthly via export-monthly-evidence.ts'],
  });

  controls = mergeControl(controls, 'CC7.2', {
    status: hasBonService && hasIrp ? 'partial' : 'gap',
    evidence: [
      hasBonService ? 'BonIncidentReportingService.ts present' : 'BoN incident service missing',
      hasIrp ? 'docs/compliance/INCIDENT_RESPONSE_PLAN.md' : 'IR plan missing',
      hasIrPolicy ? 'docs/compliance/policies/INCIDENT_RESPONSE_POLICY.md' : 'IR policy missing',
      `bon_incident_reports in period: ${bonStats[0]?.count ?? 0}`,
      hasSecurityWorkflow ? 'GitHub security-audit workflow' : 'No CI security workflow',
      hasTabletopResults
        ? 'compliance/evidence/incidents/tabletop-2026-06-15-results.md'
        : hasTabletopSchedule
          ? 'Tabletop scheduled — results pending'
          : '',
      'app/api/compliance/psd/bon-incident/route.ts',
    ].filter(Boolean),
    gaps: [
      hasTabletopResults
        ? 'Signed IR policy PDF not in compliance/evidence/policies/'
        : hasTabletopSchedule
          ? 'Tabletop exercise scheduled — results not yet recorded'
          : 'Table-top exercise not scheduled',
    ],
    remediation: hasTabletopResults
      ? ['CEO/CTO sign IR policy; store PDF in compliance/evidence/policies/']
      : [
          'Complete tabletop and file under compliance/evidence/incidents/',
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
