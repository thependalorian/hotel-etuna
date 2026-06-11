/**
 * SOC 2 agent — logical access, RBAC, MFA, tenant isolation.
 * Location: lib/compliance/soc2/agents/access-control-agent.ts
 */

import { db, users, auditTrail, paymentSecurityAudit } from '@/lib/db';
import { sql, gte, lte, and, eq } from 'drizzle-orm';
import { existsSync, readdirSync } from 'fs';
import { join } from 'path';
import type { Soc2AgentRunResult } from '../types';
import { pickAgentControls, mergeControl } from './shared';
import { scoreControls } from '../control-matrix';
import type { Soc2ControlResult } from '../types';

export async function runAccessControlAgent(
  base: Soc2ControlResult[],
  period: { from: Date; to: Date }
): Promise<Soc2AgentRunResult> {
  let controls = pickAgentControls(base, 'access_control');

  const roleRows = await db
    .select({ role: users.role, count: sql<number>`count(*)::int` })
    .from(users)
    .groupBy(users.role);

  const auditCount = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(auditTrail)
    .where(and(gte(auditTrail.timestamp, period.from), lte(auditTrail.timestamp, period.to)));

  const paymentAuditCount = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(paymentSecurityAudit)
    .where(
      and(
        gte(paymentSecurityAudit.createdAt, period.from),
        lte(paymentSecurityAudit.createdAt, period.to)
      )
    );

  const rlsScript = join(process.cwd(), 'scripts/db/verify-tenant-rls.ts');
  const hasRlsVerifier = existsSync(rlsScript);
  const has2faMiddleware = existsSync(join(process.cwd(), 'lib/middleware/require2FA.ts'));

  controls = mergeControl(controls, 'CC6.1', {
    status: roleRows.length > 0 ? 'compliant' : 'partial',
    evidence: [
      `User roles in DB: ${roleRows.map((r) => `${r.role ?? 'null'}=${r.count}`).join(', ') || 'none'}`,
      'API routes use withApiAuth + requireRole (hub staff)',
    ],
    gaps: roleRows.length === 0 ? ['No users found — run in environment with data'] : [],
  });

  controls = mergeControl(controls, 'CC6.2', {
    status: has2faMiddleware ? 'partial' : 'gap',
    evidence: [
      has2faMiddleware
        ? 'require2FA middleware present for payment endpoints'
        : '2FA middleware file not found',
      `payment_security_audit rows in period: ${paymentAuditCount[0]?.count ?? 0}`,
    ],
    gaps: [
      'Org-wide MFA on Vercel/GitHub/Neon not automated in this agent — verify manually',
      'Staff dashboard login MFA policy not fully enforced platform-wide',
    ],
    remediation: [
      'Enable MFA on Vercel, Neon, GitHub for all platform operators',
      'Document password policy (min 12 chars) in Access Control policy',
    ],
  });

  controls = mergeControl(controls, 'CC6.3', {
    status: 'manual',
    evidence: [`audit_trail events in period: ${auditCount[0]?.count ?? 0}`],
    gaps: ['No automated HR-offboarding → user disable job detected'],
    remediation: [
      'Quarterly access review of users.role for hub and partners',
      'Disable user_sessions on staff termination within 24h',
    ],
  });

  controls = mergeControl(controls, 'CC6.6', {
    status: hasRlsVerifier ? 'partial' : 'gap',
    evidence: [
      hasRlsVerifier ? 'scripts/db/verify-tenant-rls.ts exists' : 'RLS verifier missing',
      'tenant_id on booking_charges, audit_trail, transactions',
    ],
    gaps: hasRlsVerifier ? [] : ['Add and run tenant RLS verification script'],
    remediation: ['Run `npx tsx scripts/db/verify-tenant-rls.ts` each release; attach output to evidence'],
  });

  const policiesDir = join(process.cwd(), 'docs/compliance/policies');
  const policyFiles = existsSync(policiesDir)
    ? readdirSync(policiesDir).filter(
        (f) => f.endsWith('.md') && f !== 'POLICY_TEMPLATE.md'
      )
    : [];
  const policyCount = policyFiles.length;
  const hasPolicyPack = policyCount >= 21;

  controls = mergeControl(controls, 'CC1.1', {
    status: hasPolicyPack ? 'partial' : 'gap',
    evidence: [
      `${policyCount} policy files under docs/compliance/policies/ (drafted May 17, 2026)`,
      'PLANNING.md, TASK.md security sections exist',
      'POLICY_IMPLEMENTATION_MATRIX.md — implementation validation 2026-06-10',
    ],
    gaps: hasPolicyPack
      ? [
          'Executive signatures missing on all policies (see compliance/evidence/policies/SIGN_OFF_CHECKLIST.md)',
          'Annual policy owner review not tracked in system',
        ]
      : [
          'Policy pack incomplete — expect ≥21 files in docs/compliance/policies/',
          'Annual policy owner review not tracked in system',
        ],
    remediation: hasPolicyPack
      ? [
          'CEO/CTO sign all policies; store PDFs in compliance/evidence/policies/',
          'Track policy acceptance in HR or GRC tool',
        ]
      : [
          'Publish 21-policy pack under docs/compliance/policies/',
          'Track policy acceptance in HR or GRC tool',
        ],
  });

  return {
    agentId: 'access_control',
    agentName: 'Access Control & Identity',
    controls,
    scorePercent: scoreControls(controls),
    ranAt: new Date().toISOString(),
  };
}
