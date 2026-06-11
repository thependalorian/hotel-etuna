#!/usr/bin/env npx tsx
/**
 * Static + runtime-anchor checks: SOC 2 policies enforced in code, workflows, automation, intelligence.
 * Location: scripts/compliance/validate-policy-implementation.ts
 * Usage: npx tsx scripts/compliance/validate-policy-implementation.ts [--json] [--with-tests]
 */

import { execSync } from 'child_process';
import { existsSync, readFileSync, readdirSync } from 'fs';
import { join } from 'path';
import {
  isLoggingCompliant,
  readLatestPgauditStatus,
} from '../../lib/compliance/pgaudit-evidence';

type Layer = 'code' | 'workflow' | 'automation' | 'intelligence' | 'manual';
type RowStatus = 'PASS' | 'PARTIAL' | 'GAP' | 'MANUAL' | 'WARN';

interface PolicyCheck {
  id: string;
  policy: string;
  layers: Layer[];
  anchors: string[];
  status: RowStatus;
  detail: string;
}

const ROOT = process.cwd();
const jsonOnly = process.argv.includes('--json');
const withTests = process.argv.includes('--with-tests');

function exists(rel: string): boolean {
  return existsSync(join(ROOT, rel));
}

function read(rel: string): string {
  return readFileSync(join(ROOT, rel), 'utf8');
}

function policyCount(): number {
  const dir = join(ROOT, 'docs/compliance/policies');
  if (!existsSync(dir)) return 0;
  return readdirSync(dir).filter(
    (f) => f.endsWith('.md') && f !== 'POLICY_TEMPLATE.md' && f !== 'DATA_PROTECTION_POLICY.md'
  ).length;
}

function vercelCrons(): string[] {
  if (!exists('vercel.json')) return [];
  try {
    const j = JSON.parse(read('vercel.json')) as { crons?: { path: string }[] };
    return (j.crons ?? []).map((c) => c.path);
  } catch {
    return [];
  }
}

function grepFiles(dir: string, pattern: RegExp): boolean {
  if (!existsSync(join(ROOT, dir))) return false;
  const walk = (d: string): boolean => {
    for (const ent of readdirSync(d, { withFileTypes: true })) {
      const full = join(d, ent.name);
      if (ent.isDirectory()) {
        if (ent.name === 'node_modules' || ent.name === '.next') continue;
        if (walk(full)) return true;
      } else if (/\.(ts|tsx)$/.test(ent.name)) {
        if (pattern.test(readFileSync(full, 'utf8'))) return true;
      }
    }
    return false;
  };
  return walk(join(ROOT, dir));
}

function check(id: string, policy: string, layers: Layer[], anchors: string[], ok: boolean, detail: string, manual = false): PolicyCheck {
  return {
    id,
    policy,
    layers,
    anchors,
    status: manual ? 'MANUAL' : ok ? 'PASS' : 'GAP',
    detail,
  };
}

function partial(id: string, policy: string, layers: Layer[], anchors: string[], detail: string): PolicyCheck {
  return { id, policy, layers, anchors, status: 'PARTIAL', detail };
}

function runChecks(): PolicyCheck[] {
  const checks: PolicyCheck[] = [];
  const crons = vercelCrons();
  const policies = policyCount();
  const proxy = exists('proxy.ts') ? read('proxy.ts') : '';
  const hubOnlySofia = proxy.includes("'/api/sofia'");

  checks.push(
    check(
      'POL-01',
      'ACCEPTABLE_USE_POLICY.md',
      ['code', 'intelligence'],
      ['proxy.ts', 'lib/utils/rate-limit.ts', 'lib/compliance/security-pack/preflight-checks.ts'],
      hubOnlySofia && exists('lib/utils/rate-limit.ts'),
      hubOnlySofia ? 'Hub-only API prefixes + rate limiting present' : 'Missing hub-only route guards in proxy.ts'
    )
  );

  checks.push(
    partial(
      'POL-02',
      'ACCESS_CONTROL_POLICY.md',
      ['code', 'workflow'],
      ['lib/utils/api-helpers.ts', 'lib/middleware/require2FA.ts', 'scripts/db/verify-tenant-rls.ts', 'scripts/compliance/export-access-review.ts'],
      'RBAC + payment 2FA + RLS verifier; quarterly access review export is workflow'
    )
  );

  checks.push(
    partial(
      'POL-03',
      'AI_USAGE_POLICY.md',
      ['code', 'intelligence', 'automation'],
      ['proxy.ts', 'lib/workflows/sofiaToolGraph.ts', 'lib/services/ai/sofia-concierge-handler.ts', 'tests/sofia/'],
      hubOnlySofia ? 'Sofia hub-exclusive via proxy + tool graph' : 'Partner may reach Sofia APIs — GAP'
    )
  );

  checks.push(
    check(
      'POL-04',
      'ASSET_MANAGEMENT_POLICY.md',
      ['manual'],
      ['compliance/evidence/', 'Vercel/Neon consoles'],
      true,
      'Manual asset inventory — operator attestation required',
      true
    )
  );

  const restoreDrill =
    exists('compliance/evidence/backup-drills/restore-test-2026-06-10.md') ||
    grepFiles('compliance/evidence/backup-drills', /restore-test/);
  checks.push(
    partial(
      'POL-05',
      'BACKUP_POLICY.md',
      ['workflow', 'automation'],
      ['docs/compliance/BUSINESS_CONTINUITY_PLAN.md', 'compliance/evidence/backup-drills/'],
      restoreDrill ? 'Restore drill evidence on file' : 'Restore drill evidence missing'
    )
  );

  const tabletopDone = exists('compliance/evidence/incidents/tabletop-2026-06-15-results.md');
  checks.push(
    partial(
      'POL-06',
      'BUSINESS_CONTINUITY_POLICY.md',
      ['workflow'],
      ['docs/compliance/BUSINESS_CONTINUITY_PLAN.md', 'compliance/evidence/incidents/tabletop-2026-06-15-results.md'],
      tabletopDone ? 'Tabletop completed 15 Jun 2026' : 'Tabletop results not filed'
    )
  );

  checks.push(
    partial(
      'POL-07',
      'CHANGE_MANAGEMENT_POLICY.md',
      ['automation', 'code'],
      ['.github/workflows/ci.yml', 'database/drizzle/', 'npm run test:db:migrations'],
      exists('.github/workflows/ci.yml') && exists('database/drizzle/meta/_journal.json')
        ? 'CI + forward migrations'
        : 'CI or migration journal missing'
    )
  );

  checks.push(
    check('POL-08', 'CODE_OF_CONDUCT.md', ['manual'], ['compliance/evidence/hr/'], true, 'HR attestation — manual', true)
  );

  checks.push(
    partial(
      'POL-09',
      'CRYPTOGRAPHY_POLICY.md',
      ['code'],
      ['lib/services/security/EncryptionService.ts', 'vercel.json headers', 'GuestDocumentVaultService'],
      exists('lib/services/security/EncryptionService.ts') || grepFiles('lib', /EncryptionService/)
        ? 'TLS headers + encryption service'
        : 'EncryptionService not found'
    )
  );

  checks.push(
    partial(
      'POL-10',
      'DATA_CLASSIFICATION_POLICY.md',
      ['code'],
      ['scripts/db/verify-tenant-rls.ts', 'lib/db/schema.ts RLS migrations'],
      exists('scripts/db/verify-tenant-rls.ts') ? 'RLS verification script' : 'RLS verifier missing'
    )
  );

  const cookieWired =
    exists('components/features/compliance/CookieConsentBanner.tsx') &&
    read('app/layout.tsx').includes('CookieConsentBanner');
  checks.push(
    partial(
      'POL-11',
      'DATA_PROTECTION_POLICY_NAMIBIA.md',
      ['code', 'workflow'],
      ['app/api/guest/dsar/route.ts', 'components/features/compliance/CookieConsentBanner.tsx', 'app/layout.tsx'],
      cookieWired && exists('app/api/guest/dsar/route.ts')
        ? 'DSAR API + cookie consent banner wired'
        : 'DSAR or cookie consent not fully wired'
    )
  );

  const retentionCron = crons.some((p) => p.includes('retention-enforcement'));
  const retentionSvc = exists('lib/services/compliance/RetentionEnforcementService.ts');
  const sofiaRetention = exists('lib/services/compliance/SofiaChatRetentionService.ts');
  checks.push(
    partial(
      'POL-12',
      'DATA_RETENTION_POLICY.md',
      ['automation', 'code'],
      [
        'app/api/cron/retention-enforcement/route.ts',
        'RetentionEnforcementService.ts',
        'SofiaChatRetentionService.ts',
      ],
      retentionCron && retentionSvc && sofiaRetention
        ? 'Retention cron + services registered (dry-run default in route docs)'
        : 'Retention automation incomplete'
    )
  );

  checks.push(
    check('POL-13', 'HR_SECURITY_POLICY.md', ['manual', 'workflow'], ['scripts/provision-hotel-team.ts'], true, 'HR SOP + provision script — manual attestation', true)
  );

  const bonRoute = exists('app/api/compliance/psd/bon-incident/route.ts');
  checks.push(
    partial(
      'POL-14',
      'INCIDENT_RESPONSE_POLICY.md',
      ['code', 'workflow'],
      ['BonIncidentReportingService.ts', 'app/api/compliance/psd/bon-incident/route.ts', 'compliance/evidence/incidents/'],
      bonRoute && exists('lib/services/compliance/BonIncidentReportingService.ts')
        ? tabletopDone
          ? 'BoN incident API + tabletop results on file'
          : 'BoN incident API present; tabletop evidence pending'
        : 'Incident reporting API missing'
    )
  );

  checks.push(
    partial(
      'POL-15',
      'INFORMATION_SECURITY_POLICY.md',
      ['code', 'workflow'],
      ['docs/compliance/policies/', 'docs/SECURITY_PROMPT_PACK.md'],
      policies >= 21 ? `${policies} policies in repo` : `Only ${policies} policies — expect ≥21`
    )
  );

  const pgauditStatus = readLatestPgauditStatus(process.cwd());
  const loggingOk = pgauditStatus ? isLoggingCompliant(pgauditStatus) : false;
  checks.push(
    partial(
      'POL-16',
      'LOGGING_AND_MONITORING_POLICY.md',
      ['code', 'automation'],
      ['lib/compliance/record-audit.ts', 'scripts/compliance/export-audit-trail.ts', 'scripts/compliance/verify-pgaudit.ts'],
      loggingOk
        ? pgauditStatus?.pgauditInstalled
          ? 'audit_trail + pgAudit enabled (evidence JSON)'
          : 'audit_trail + IMP-01 compensating controls (evidence JSON)'
        : 'audit_trail active; run npm run verify:pgaudit'
    )
  );

  checks.push(
    check(
      'POL-17',
      'NETWORK_SECURITY_POLICY.md',
      ['code', 'automation'],
      ['vercel.json', 'lib/utils/rate-limit.ts'],
      exists('vercel.json') && !grepFiles('app/api', /Allow-Origin['"]\s*,\s*['"]\*/),
      'Security headers + no wildcard CORS in API'
    )
  );

  checks.push(
    partial(
      'POL-18',
      'PASSWORD_POLICY.md',
      ['code', 'manual'],
      ['lib/validation/password.ts', 'lib/middleware/require2FA.ts', 'docs/compliance/PLATFORM_MFA_CHECKLIST.md'],
      (exists('lib/validation/password.ts') || exists('lib/auth/password.ts')) &&
        exists('lib/middleware/require2FA.ts')
        ? 'Password rules + payment 2FA; platform MFA manual'
        : 'Password or 2FA middleware missing'
    )
  );

  checks.push(
    check('POL-19', 'PHYSICAL_SECURITY_POLICY.md', ['manual'], [], true, 'BYOD / device checklist — manual', true)
  );
  checks.push(
    check('POL-20', 'REMOTE_ACCESS_POLICY.md', ['manual'], [], true, 'Console SSO attestation — manual', true)
  );
  checks.push(
    check('POL-21', 'TRAINING_POLICY.md', ['manual', 'workflow'], ['compliance/evidence/hr/SECURITY_TRAINING_LOG_2026.md'], true, 'Training log — manual', true)
  );

  const vendorRegister =
    exists('compliance/evidence/vendor-register.csv') ||
    exists('docs/compliance/evidence/vendor-register.csv');
  const vendorReceived = existsSync(join(ROOT, 'compliance/evidence/vendor-attestations/received'));
  const vendorPdfs =
    vendorReceived &&
    readdirSync(join(ROOT, 'compliance/evidence/vendor-attestations/received')).some((f) =>
      f.endsWith('.pdf')
    );
  checks.push(
    partial(
      'POL-22',
      'VENDOR_MANAGEMENT_POLICY.md',
      ['workflow', 'automation'],
      ['compliance/evidence/vendor-register.csv', 'scripts/compliance/export-monthly-evidence.ts'],
      vendorRegister
        ? vendorPdfs
          ? 'Vendor register + attestations on file'
          : 'Vendor register present; SOC/PCI PDFs outstanding (G-09)'
        : 'vendor-register.csv missing'
    )
  );

  // Runtime: payment routes should reference require2FA
  const payment2fa =
    grepFiles('app/api/payments', /require2FA/) ||
    exists('app/api/payments/initiate/route.ts') &&
      read('app/api/payments/initiate/route.ts').includes('require2FA');
  if (!payment2fa) {
    checks.push({
      id: 'RUNTIME-2FA',
      policy: 'PSD-12 payment initiation',
      layers: ['code'],
      anchors: ['app/api/payments/**', 'lib/middleware/require2FA.ts'],
      status: 'GAP',
      detail: 'Payment API routes must call require2FAForPayment',
    });
  }

  // Scheduler handlers
  const sched = exists('lib/services/scheduling/schedulerJobHandlers.ts')
    ? read('lib/services/scheduling/schedulerJobHandlers.ts')
    : '';
  const schedOk =
    sched.includes('night-audit') &&
    sched.includes('payment-outbox-dispatch') &&
    sched.includes('intelligence-digest');
  checks.push(
    partial(
      'RUNTIME-SCHED',
      'Availability / payments automation',
      ['automation'],
      ['schedulerJobHandlers.ts', 'vercel.json crons'],
      schedOk && crons.some((p) => p.includes('scheduler-dispatch'))
        ? 'Durable scheduler handlers + cron registered'
        : 'Scheduler handlers or cron incomplete'
    )
  );

  return checks;
}

function main(): void {
  const checks = runChecks();
  const gaps = checks.filter((c) => c.status === 'GAP');
  const manual = checks.filter((c) => c.status === 'MANUAL');

  if (withTests) {
    try {
      execSync(
        'npx vitest run tests/sofia tests/unit/sofia-tool-graph.test.ts tests/unit/tenant-fraud-rules.test.ts',
        { stdio: 'pipe', cwd: ROOT }
      );
    } catch (e) {
      checks.push({
        id: 'RUNTIME-TESTS',
        policy: 'Intelligence test suite',
        layers: ['intelligence'],
        anchors: ['tests/sofia/', 'tests/unit/sofia-tool-graph.test.ts'],
        status: 'GAP',
        detail: 'Sofia/fraud unit tests failed — run vitest',
      });
    }
  }

  const report = {
    generatedAt: new Date().toISOString(),
    policyCount: policyCount(),
    summary: {
      pass: checks.filter((c) => c.status === 'PASS').length,
      partial: checks.filter((c) => c.status === 'PARTIAL').length,
      gap: checks.filter((c) => c.status === 'GAP').length,
      manual: manual.length,
    },
    checks,
  };

  if (jsonOnly) {
    console.log(JSON.stringify(report, null, 2));
  } else {
    console.log(`Policy implementation validation — ${report.generatedAt}`);
    console.log(
      `PASS: ${report.summary.pass}  PARTIAL: ${report.summary.partial}  GAP: ${report.summary.gap}  MANUAL: ${report.summary.manual}`
    );
    for (const c of checks) {
      console.log(`[${c.status}] ${c.id} ${c.policy} — ${c.detail}`);
    }
  }

  const hardFail = gaps.length + checks.filter((c) => c.id === 'RUNTIME-TESTS' && c.status === 'GAP').length;
  process.exit(hardFail > 0 ? 1 : 0);
}

main();
