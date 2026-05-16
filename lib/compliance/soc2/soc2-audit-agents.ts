/**
 * SOC 2 audit agents — automated evidence collectors per control domain.
 * Location: lib/compliance/soc2/soc2-audit-agents.ts
 */

import fs from 'node:fs';
import path from 'node:path';
import { db, auditTrail, cybersecurityIncidents, supportTickets } from '@/lib/db';
import { HOTEL_ETUNA_SOC2_CONTROLS } from '@/lib/compliance/soc2/nayaone-tsc-framework';
import type {
  Soc2AgentId,
  Soc2AgentRunResult,
  Soc2ControlResult,
  Soc2ControlStatus,
} from '@/lib/compliance/soc2/types';
import { and, count, eq, gte, lte, notInArray } from 'drizzle-orm';

const PROJECT_ROOT = process.cwd();

function artifact(rel: string): boolean {
  return fs.existsSync(path.join(PROJECT_ROOT, rel));
}

function scoreStatus(status: Soc2ControlStatus): number {
  switch (status) {
    case 'compliant':
      return 100;
    case 'inherited':
      return 85;
    case 'partial':
      return 60;
    case 'manual':
      return 50;
    case 'gap':
      return 0;
  }
}

function buildControl(
  def: (typeof HOTEL_ETUNA_SOC2_CONTROLS)[number],
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

async function auditMetrics(from: Date, to: Date) {
  const [auditRow] = await db
    .select({ n: count() })
    .from(auditTrail)
    .where(and(gte(auditTrail.timestamp, from), lte(auditTrail.timestamp, to)));

  const [openIncidents] = await db
    .select({ n: count() })
    .from(cybersecurityIncidents)
    .where(eq(cybersecurityIncidents.status, 'open'));

  const [openTickets] = await db
    .select({ n: count() })
    .from(supportTickets)
    .where(notInArray(supportTickets.status, ['resolved', 'closed']));

  return {
    auditEvents: Number(auditRow?.n ?? 0),
    openCyberIncidents: Number(openIncidents?.n ?? 0),
    openSupportTickets: Number(openTickets?.n ?? 0),
  };
}

export async function runAccessControlAgent(
  from: Date,
  to: Date
): Promise<Soc2AgentRunResult> {
  const defs = HOTEL_ETUNA_SOC2_CONTROLS.filter((c) => c.agentId === 'access_control');
  const controls: Soc2ControlResult[] = [];

  const rbacArtifacts = [
    'proxy.ts',
    'lib/utils/api-helpers.ts',
    'lib/auth/tenant-context.ts',
    'database/drizzle/0010_booking_charges_rls.sql',
  ];
  const rbacOk = rbacArtifacts.every(artifact);
  const twoFaOk = artifact('lib/middleware/require2FA.ts');
  const rateLimitOk = artifact('lib/utils/rate-limit.ts');

  for (const def of defs) {
    if (def.controlId === 'CC6.3') {
      controls.push(
        buildControl(
          def,
          'manual',
          ['Staff offboarding must disable auth + revoke sessions'],
          ['No automated HRIS-triggered deprovisioning'],
          ['Document offboarding checklist; quarterly access review'],
          false
        )
      );
      continue;
    }
    if (def.controlId === 'CC6.2') {
      controls.push(
        buildControl(
          def,
          twoFaOk ? 'compliant' : 'gap',
          twoFaOk ? ['lib/middleware/require2FA.ts', 'app/api/payments/initiate/route.ts'] : [],
          twoFaOk ? [] : ['2FA middleware missing'],
          twoFaOk ? [] : ['Wire require2FA on all payment rails'],
          true
        )
      );
      continue;
    }
    if (def.controlId === 'CC6.6') {
      controls.push(
        buildControl(
          def,
          rateLimitOk ? 'compliant' : 'gap',
          rateLimitOk ? ['lib/utils/rate-limit.ts', 'proxy.ts rate limit branch'] : [],
          rateLimitOk ? [] : ['Rate limiting not found'],
          [],
          true
        )
      );
      continue;
    }
    if (def.controlId === 'CC6.1') {
      controls.push(
        buildControl(
          def,
          rbacOk ? 'compliant' : 'partial',
          rbacArtifacts.filter(artifact),
          rbacOk ? [] : ['Missing RBAC/RLS artifacts'],
          rbacOk ? [] : ['Restore tenant RLS migration and proxy RBAC'],
          true
        )
      );
      continue;
    }
    controls.push(
      buildControl(
        def,
        artifact('docs/project/PLANNING.md') ? 'partial' : 'gap',
        artifact('docs/project/PLANNING.md') ? ['docs/project/PLANNING.md', 'docs/project/PRD.md'] : [],
        ['Formal signed security policies pack not in repo'],
        ['Adopt 12-policy SOC 2 pack under compliance/policies/'],
        false
      )
    );
  }

  void from;
  void to;
  const scorePercent = Math.round(
    controls.reduce((s, c) => s + scoreStatus(c.status), 0) / controls.length
  );
  return {
    agentId: 'access_control',
    agentName: 'Access Control Agent',
    controls,
    scorePercent,
    ranAt: new Date().toISOString(),
  };
}

export async function runMonitoringIncidentsAgent(
  from: Date,
  to: Date
): Promise<Soc2AgentRunResult> {
  const defs = HOTEL_ETUNA_SOC2_CONTROLS.filter((c) => c.agentId === 'monitoring_incidents');
  const metrics = await auditMetrics(from, to);
  const controls: Soc2ControlResult[] = [];

  for (const def of defs) {
    if (def.controlId === 'CC7.2') {
      const status: Soc2ControlStatus =
        metrics.auditEvents > 0 && artifact('lib/compliance/record-audit.ts')
          ? 'compliant'
          : metrics.auditEvents > 0
            ? 'partial'
            : 'gap';
      controls.push(
        buildControl(
          def,
          status,
          [
            `audit_trail events in period: ${metrics.auditEvents}`,
            'lib/compliance/record-audit.ts',
            'lib/utils/security-logger.ts',
          ],
          status === 'compliant' ? [] : ['Insufficient audit volume or missing recorder'],
          status === 'compliant' ? [] : ['Ensure recordAuditTrail on all privileged APIs'],
          true
        )
      );
      continue;
    }
    if (def.controlId === 'CC7.3') {
      const hasSchema = artifact('lib/db/schema.ts');
      const status: Soc2ControlStatus = hasSchema
        ? metrics.openCyberIncidents === 0
          ? 'partial'
          : 'partial'
        : 'gap';
      controls.push(
        buildControl(
          def,
          status,
          [
            `Open cyber incidents: ${metrics.openCyberIncidents}`,
            `Open support tickets: ${metrics.openSupportTickets}`,
            'cybersecurity_incidents table',
            'app/api/compliance/cyber-incidents/',
          ],
          ['Formal IR runbook PDF not in repo', 'Annual IR tabletop not logged'],
          ['Publish incident-response.md; schedule tabletop'],
          true
        )
      );
      continue;
    }
    if (def.controlId === 'PI1.1') {
      const folioOk =
        artifact('lib/services/folio/FolioService.ts') &&
        artifact('lib/services/accounting/HospitalityAccountingService.ts');
      controls.push(
        buildControl(
          def,
          folioOk ? 'compliant' : 'partial',
          [
            'booking_charges folio ledger',
            'transactions + cash_reconciliations',
            'HospitalityAccountingService double-entry export',
          ],
          folioOk ? [] : ['Accounting export incomplete'],
          [],
          true
        )
      );
    }
  }

  const scorePercent = Math.round(
    controls.reduce((s, c) => s + scoreStatus(c.status), 0) / Math.max(controls.length, 1)
  );
  return {
    agentId: 'monitoring_incidents',
    agentName: 'Monitoring & Incidents Agent',
    controls,
    scorePercent,
    ranAt: new Date().toISOString(),
  };
}

export async function runChangeManagementAgent(
  _from: Date,
  _to: Date
): Promise<Soc2AgentRunResult> {
  const defs = HOTEL_ETUNA_SOC2_CONTROLS.filter((c) => c.agentId === 'change_management');
  const drizzleDir = path.join(PROJECT_ROOT, 'database/drizzle');
  const migrationCount = fs.existsSync(drizzleDir)
    ? fs.readdirSync(drizzleDir).filter((f) => f.endsWith('.sql')).length
    : 0;
  const controls = defs.map((def) =>
    buildControl(
      def,
      migrationCount >= 5 && artifact('docs/project/PLANNING.md') ? 'partial' : 'gap',
      [
        `${migrationCount} Drizzle SQL migrations`,
        'Git version control',
        artifact('.github/workflows') ? '.github/workflows CI' : 'CI workflow — verify',
      ],
      ['PR approval evidence not automated', 'Emergency change log not centralized'],
      ['Enable branch protection; link tickets to PRs'],
      true
    )
  );

  return {
    agentId: 'change_management',
    agentName: 'Change Management Agent',
    controls,
    scorePercent: Math.round(
      controls.reduce((s, c) => s + scoreStatus(c.status), 0) / Math.max(controls.length, 1)
    ),
    ranAt: new Date().toISOString(),
  };
}

export async function runAvailabilityAgent(
  _from: Date,
  _to: Date
): Promise<Soc2AgentRunResult> {
  const defs = HOTEL_ETUNA_SOC2_CONTROLS.filter((c) => c.agentId === 'availability');
  const controls = defs.map((def) => {
    if (def.controlId === 'A1.1') {
      const slaDoc = artifact('docs/BUFFR_FINANCIAL_SERVICES_PROPOSAL_AND_SLA.md');
      return buildControl(
        def,
        slaDoc ? 'partial' : 'gap',
        slaDoc ? ['docs/BUFFR_FINANCIAL_SERVICES_PROPOSAL_AND_SLA.md'] : [],
        ['Vercel uptime SLA not attached'],
        ['Publish customer-facing SLA page'],
        false
      );
    }
    if (def.controlId === 'A1.2') {
      return buildControl(
        def,
        'inherited',
        ['Neon managed PostgreSQL — PITR/backups per Neon SOC 2'],
        ['Review Neon CUECs annually'],
        ['Download Neon SOC 2; document restore test quarterly'],
        false
      );
    }
    return buildControl(
      def,
      'manual',
      [],
      ['No DR test record in repository'],
      ['Annual DR exercise + post-mortem template'],
      false
    );
  });

  return {
    agentId: 'availability',
    agentName: 'Availability Agent',
    controls,
    scorePercent: Math.round(
      controls.reduce((s, c) => s + scoreStatus(c.status), 0) / controls.length
    ),
    ranAt: new Date().toISOString(),
  };
}

export async function runConfidentialityAgent(
  _from: Date,
  _to: Date
): Promise<Soc2AgentRunResult> {
  const defs = HOTEL_ETUNA_SOC2_CONTROLS.filter((c) => c.agentId === 'confidentiality');
  const encOk = artifact('lib/services/security/EncryptionService.ts');
  const legalOk = artifact('app/legal/privacy/page.tsx') || artifact('app/(legal)/');

  const controls = defs.map((def) => {
    if (def.controlId === 'CC6.7') {
      return buildControl(
        def,
        encOk ? 'partial' : 'gap',
        [
          encOk ? 'lib/services/security/EncryptionService.ts' : '',
          'TLS via Vercel edge',
          'DATABASE_URL sslmode=require',
        ].filter(Boolean),
        ['Key rotation procedure not documented'],
        ['Document KMS/env rotation in security policy'],
        true
      );
    }
    if (def.controlId === 'C1.1') {
      return buildControl(
        def,
        artifact('database/drizzle/0010_booking_charges_rls.sql') ? 'compliant' : 'partial',
        ['Tenant RLS on booking_charges', 'lib/auth/tenant-context.ts'],
        [],
        [],
        true
      );
    }
    return buildControl(
      def,
      'partial',
      ['Separate Vercel preview vs production (configure per project)'],
      ['Document dev/staging data policy — no production PII in dev'],
      ['Neon branch per environment; ban prod dumps in dev'],
      false
    );
  });

  void legalOk;
  return {
    agentId: 'confidentiality',
    agentName: 'Confidentiality Agent',
    controls,
    scorePercent: Math.round(
      controls.reduce((s, c) => s + scoreStatus(c.status), 0) / controls.length
    ),
    ranAt: new Date().toISOString(),
  };
}

export async function runVendorSubserviceAgent(
  _from: Date,
  _to: Date
): Promise<Soc2AgentRunResult> {
  const defs = HOTEL_ETUNA_SOC2_CONTROLS.filter((c) => c.agentId === 'vendor_subservice');
  const controls = defs.map((def) =>
    buildControl(
      def,
      'manual',
      [
        'Subservices: Vercel (hosting), Neon (database), Adumo (payments)',
        'Reference: NayaOne SOC 2 AWS carved-out model (§III)',
      ],
      ['Vercel/Neon/Adumo SOC 2 reports not stored in repo'],
      [
        'Annual review: Vercel SOC 2, Neon SOC 2, Adumo security pack',
        'Log CUEC mapping in compliance/vendor-register',
      ],
      false
    )
  );

  return {
    agentId: 'vendor_subservice',
    agentName: 'Vendor & Subservice Agent',
    controls,
    scorePercent: 50,
    ranAt: new Date().toISOString(),
  };
}

const AGENT_RUNNERS: Record<
  Soc2AgentId,
  (from: Date, to: Date) => Promise<Soc2AgentRunResult>
> = {
  access_control: runAccessControlAgent,
  monitoring_incidents: runMonitoringIncidentsAgent,
  change_management: runChangeManagementAgent,
  availability: runAvailabilityAgent,
  confidentiality: runConfidentialityAgent,
  vendor_subservice: runVendorSubserviceAgent,
};

export async function runAllSoc2Agents(from: Date, to: Date): Promise<Soc2AgentRunResult[]> {
  const ids = Object.keys(AGENT_RUNNERS) as Soc2AgentId[];
  return Promise.all(ids.map((id) => AGENT_RUNNERS[id](from, to)));
}
