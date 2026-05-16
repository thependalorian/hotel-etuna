/**
 * SOC 2 audit agents — automated evidence collectors per trust domain.
 * Location: lib/compliance/soc2/agents/run-soc2-agents.ts
 *
 * Each agent returns control results with status, evidence paths, and gaps.
 */

import fs from 'fs';
import path from 'path';
import { db, auditTrail, systemLogs, cybersecurityIncidents } from '@/lib/db';
import { and, count, eq, gte, lte } from 'drizzle-orm';
import { SOC2_CONTROL_CATALOG } from '@/lib/compliance/soc2/control-catalog';
import type {
  Soc2AgentId,
  Soc2AgentRunResult,
  Soc2ControlResult,
  Soc2ControlStatus,
} from '@/lib/compliance/soc2/types';

const ROOT = process.cwd();

function exists(relPath: string): boolean {
  return fs.existsSync(path.join(ROOT, relPath));
}

function readIncludes(relPath: string, needle: string): boolean {
  try {
    const content = fs.readFileSync(path.join(ROOT, relPath), 'utf8');
    return content.includes(needle);
  } catch {
    return false;
  }
}

function scoreAgent(controls: Soc2ControlResult[]): number {
  if (controls.length === 0) return 0;
  const weights: Record<Soc2ControlStatus, number> = {
    compliant: 100,
    inherited: 90,
    partial: 60,
    manual: 40,
    gap: 0,
  };
  const total = controls.reduce((sum, c) => sum + weights[c.status], 0);
  return Math.round(total / controls.length);
}

function control(
  def: (typeof SOC2_CONTROL_CATALOG)[number],
  status: Soc2ControlStatus,
  evidence: string[],
  gaps: string[],
  remediation: string[],
  automated: boolean
): Soc2ControlResult {
  return {
    controlId: def.controlId,
    tscReference: def.tscReference,
    category: def.category,
    title: def.title,
    nayaoneControlRef: def.nayaoneControlRef,
    status,
    automated,
    evidence,
    gaps,
    remediation,
    agentId: def.agentId,
  };
}

function defsForAgent(agentId: Soc2AgentId) {
  return SOC2_CONTROL_CATALOG.filter((d) => d.agentId === agentId);
}

export async function runAccessControlAgent(): Promise<Soc2AgentRunResult> {
  const defs = defsForAgent('access_control');
  const results: Soc2ControlResult[] = [];

  const hasApiAuth = exists('lib/utils/api-helpers.ts') && readIncludes('lib/utils/api-helpers.ts', 'withApiAuth');
  const hasProxyRbac = exists('proxy.ts') && readIncludes('proxy.ts', 'requireRole');
  const hasRls = exists('database/drizzle/0004_hotel_etuna_tenant_rls_policies.sql');
  const has2fa = exists('lib/middleware/require2FA.ts');
  const hasRateLimit = exists('lib/utils/rate-limit.ts');

  for (const def of defs) {
    if (def.controlId === 'HE-SOC2-CC1-01') {
      const hasPlanning = exists('docs/project/PLANNING.md');
      results.push(
        control(
          def,
          hasPlanning ? 'partial' : 'gap',
          hasPlanning ? ['docs/project/PLANNING.md'] : [],
          hasPlanning ? ['Formal signed policy pack (21 templates) not in repo'] : ['No security policy documentation'],
          ['Adopt Access Control, Incident Response, Change Management policy templates; annual sign-off'],
          true
        )
      );
    } else if (def.controlId === 'HE-SOC2-CC6-01') {
      results.push(
        control(
          def,
          hasApiAuth && hasProxyRbac ? 'partial' : 'gap',
          ['lib/utils/api-helpers.ts', 'proxy.ts'].filter(exists),
          hasApiAuth ? ['Not all /api routes verified in this run — run route audit'] : ['Missing centralized API auth'],
          ['Complete route inventory; enforce withApiAuth on every mutating endpoint'],
          true
        )
      );
    } else if (def.controlId === 'HE-SOC2-CC6-02') {
      results.push(
        control(
          def,
          has2fa ? 'partial' : 'gap',
          ['lib/middleware/require2FA.ts', 'lib/services/security/TwoFactorAuthService.ts'].filter(exists),
          ['MFA not enforced for all staff console logins — payment paths only'],
          ['Enable MFA on Vercel/Neon/Stack Auth org accounts; staff SSO with MFA'],
          true
        )
      );
    } else if (def.controlId === 'HE-SOC2-CC6-03') {
      results.push(
        control(
          def,
          hasRls ? 'compliant' : 'gap',
          ['database/drizzle/0004_hotel_etuna_tenant_rls_policies.sql', 'lib/utils/api-helpers.ts'].filter(exists),
          hasRls ? [] : ['RLS policies missing'],
          hasRls ? [] : ['Apply tenant RLS on all tenant-scoped tables'],
          true
        )
      );
    } else if (def.controlId === 'HE-SOC2-CC6-04') {
      results.push(
        control(
          def,
          hasRateLimit ? 'partial' : 'gap',
          ['lib/utils/rate-limit.ts', 'proxy.ts'].filter(exists),
          ['Redis rate limit optional in dev — confirm production REDIS_URL'],
          ['Wire Upstash/Redis in Vercel prod; alert on rate_limit_exceeded spikes'],
          true
        )
      );
    }
  }

  return {
    agentId: 'access_control',
    agentName: 'Access Control Agent',
    controls: results,
    scorePercent: scoreAgent(results),
    ranAt: new Date().toISOString(),
  };
}

export async function runMonitoringIncidentsAgent(
  tenantId: string | null,
  from: Date,
  to: Date
): Promise<Soc2AgentRunResult> {
  const defs = defsForAgent('monitoring_incidents');
  const results: Soc2ControlResult[] = [];

  let auditCount = 0;
  let securityLogCount = 0;
  let incidentCount = 0;

  try {
    const auditWhere = tenantId
      ? and(eq(auditTrail.tenantId, tenantId), gte(auditTrail.timestamp, from), lte(auditTrail.timestamp, to))
      : and(gte(auditTrail.timestamp, from), lte(auditTrail.timestamp, to));
    const [auditRow] = await db.select({ n: count() }).from(auditTrail).where(auditWhere);
    auditCount = Number(auditRow?.n ?? 0);

    const logWhere = tenantId
      ? and(
          eq(systemLogs.tenantId, tenantId),
          eq(systemLogs.category, 'security'),
          gte(systemLogs.createdAt, from),
          lte(systemLogs.createdAt, to)
        )
      : and(
          eq(systemLogs.category, 'security'),
          gte(systemLogs.createdAt, from),
          lte(systemLogs.createdAt, to)
        );
    const [logRow] = await db.select({ n: count() }).from(systemLogs).where(logWhere);
    securityLogCount = Number(logRow?.n ?? 0);

    const incWhere = and(
      gte(cybersecurityIncidents.detectedAt, from),
      lte(cybersecurityIncidents.detectedAt, to)
    );
    const [incRow] = await db.select({ n: count() }).from(cybersecurityIncidents).where(incWhere);
    incidentCount = Number(incRow?.n ?? 0);
  } catch {
    // DB optional in CI without Neon
  }

  for (const def of defs) {
    if (def.controlId === 'HE-SOC2-CC7-01') {
      const hasTables =
        exists('lib/db/schema.ts') &&
        readIncludes('lib/db/schema.ts', 'auditTrail') &&
        exists('lib/utils/security-logger.ts');
      results.push(
        control(
          def,
          hasTables && auditCount > 0 ? 'partial' : hasTables ? 'partial' : 'gap',
          [
            'lib/db/schema.ts (audit_trail, system_logs)',
            'lib/utils/security-logger.ts',
            `period audit_trail rows: ${auditCount}`,
            `period security system_logs: ${securityLogCount}`,
          ],
          ['Central SIEM / Vercel log export not automated', 'Annual access review process not logged'],
          ['Export Vercel + Neon logs to retention bucket; quarterly access review ticket'],
          true
        )
      );
    } else if (def.controlId === 'HE-SOC2-CC7-02') {
      const hasIr = exists('lib/services/security/SecurityIncidentService.ts') || exists('components/compliance');
      results.push(
        control(
          def,
          hasIr ? 'partial' : 'gap',
          ['cybersecurity_incidents table', `incidents in period: ${incidentCount}`],
          ['Formal IR playbook with BoN PSD-12 timelines not published', 'Table-top test not documented'],
          ['Publish IR playbook in PLANNING; run annual tabletop; link bon_incident_reports workflow'],
          true
        )
      );
    }
  }

  return {
    agentId: 'monitoring_incidents',
    agentName: 'Monitoring & Incidents Agent',
    controls: results,
    scorePercent: scoreAgent(results),
    ranAt: new Date().toISOString(),
  };
}

export function runChangeManagementAgent(): Soc2AgentRunResult {
  const defs = defsForAgent('change_management');
  const results: Soc2ControlResult[] = [];

  const hasDrizzle = exists('database/drizzle') && exists('database/drizzle/meta/_journal.json');
  const hasCi = exists('.github/workflows/database-migration.yml') || exists('.github/workflows');
  const hasTests = exists('tests/workflows/security-workflow.test.ts');

  for (const def of defs) {
    results.push(
      control(
        def,
        hasDrizzle && hasTests ? 'partial' : 'gap',
        ['database/drizzle/', '.github/workflows/'].filter(exists),
        ['PR approval evidence not exported from GitHub', 'Release notes to customers not automated'],
        ['Require PR review on main; tag releases; internal release notes per NayaOne control 17'],
        true
      )
    );
  }

  return {
    agentId: 'change_management',
    agentName: 'Change Management Agent',
    controls: results,
    scorePercent: scoreAgent(results),
    ranAt: new Date().toISOString(),
  };
}

export function runAvailabilityAgent(): Soc2AgentRunResult {
  const defs = defsForAgent('availability');
  const results: Soc2ControlResult[] = [];

  for (const def of defs) {
    if (def.controlId === 'HE-SOC2-A1-01') {
      const slaDoc = exists('docs/BUFFR_FINANCIAL_SERVICES_PROPOSAL_AND_SLA.md');
      results.push(
        control(
          def,
          slaDoc ? 'partial' : 'gap',
          slaDoc ? ['docs/BUFFR_FINANCIAL_SERVICES_PROPOSAL_AND_SLA.md § backups'] : [],
          ['Neon restore drill not documented', 'RTO/RPO not measured'],
          ['Quarterly Neon restore test; record in compliance folder'],
          false
        )
      );
    } else {
      results.push(
        control(
          def,
          'gap',
          [],
          ['No published DR runbook', 'No uptime SLA page for guests'],
          ['Draft DR playbook; status page or SLA in Buffr agreement'],
          false
        )
      );
    }
  }

  return {
    agentId: 'availability',
    agentName: 'Availability Agent',
    controls: results,
    scorePercent: scoreAgent(results),
    ranAt: new Date().toISOString(),
  };
}

export function runConfidentialityAgent(): Soc2AgentRunResult {
  const defs = defsForAgent('confidentiality');
  const results: Soc2ControlResult[] = [];

  const hasCsp = readIncludes('proxy.ts', 'Content-Security-Policy');
  const hasConsent = exists('app/api/crm/guests/[id]/consent/route.ts');
  const hasFolio = exists('database/drizzle/0009_booking_charges_folio.sql');
  const hasPaymentAudit = readIncludes('lib/db/schema.ts', 'paymentSecurityAudit');

  for (const def of defs) {
    if (def.controlId === 'HE-SOC2-CC6-05') {
      results.push(
        control(
          def,
          hasCsp ? 'partial' : 'gap',
          ['proxy.ts', 'vercel.json'].filter(exists),
          ['Encryption at rest relies on Neon/Vercel — no app-level field encryption'],
          ['Document CUECs for Neon; enable Neon encryption confirmation in vendor file'],
          true
        )
      );
    } else if (def.controlId === 'HE-SOC2-C1-01') {
      results.push(
        control(
          def,
          hasConsent ? 'partial' : 'gap',
          ['app/api/crm/guests/[id]/consent/route.ts'].filter(exists),
          ['POPIA DPIA not in repo', 'DSAR erasure workflow incomplete per PRD'],
          ['Complete POPIA/GDPR task backlog; log consent events to audit_trail'],
          true
        )
      );
    } else {
      results.push(
        control(
          def,
          hasFolio && hasPaymentAudit ? 'partial' : 'gap',
          ['booking_charges', 'transactions', 'payment_security_audit'].map((t) => `schema: ${t}`),
          ['End-to-end reconciliation report for auditors not exported'],
          ['Use /reports/accounting and cash reconciliation exports monthly'],
          true
        )
      );
    }
  }

  return {
    agentId: 'confidentiality',
    agentName: 'Confidentiality & Integrity Agent',
    controls: results,
    scorePercent: scoreAgent(results),
    ranAt: new Date().toISOString(),
  };
}

export function runVendorSubserviceAgent(): Soc2AgentRunResult {
  const defs = defsForAgent('vendor_subservice');
  const results: Soc2ControlResult[] = [];

  for (const def of defs) {
    results.push(
      control(
        def,
        'manual',
        ['Subservices: Vercel (hosting), Neon (DB), Adumo (payments)', 'NayaOne report § carved-out AWS pattern'],
        [
          'Vercel SOC 2 / Neon compliance reports not attached',
          'Annual CUEC review not logged',
          'Adumo merchant agreement security schedule not filed',
        ],
        [
          'Download Vercel + Neon SOC 2 Type II reports annually',
          'Complete CUEC matrix (per NayaOne control 68)',
          'Store in secure compliance evidence store',
        ],
        false
      )
    );
  }

  return {
    agentId: 'vendor_subservice',
    agentName: 'Vendor & Subservice Agent',
    controls: results,
    scorePercent: scoreAgent(results),
    ranAt: new Date().toISOString(),
  };
}

export async function runAllSoc2Agents(
  tenantId: string | null,
  from: Date,
  to: Date
): Promise<Soc2AgentRunResult[]> {
  return [
    await runAccessControlAgent(),
    await runMonitoringIncidentsAgent(tenantId, from, to),
    runChangeManagementAgent(),
    runAvailabilityAgent(),
    runConfidentialityAgent(),
    runVendorSubserviceAgent(),
  ];
}
