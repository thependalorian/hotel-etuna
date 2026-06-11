/**
 * pgAudit status and IMP-01 compensating-control checks (Neon managed Postgres).
 * Location: lib/compliance/pgaudit-evidence.ts
 */

import { existsSync, readdirSync, readFileSync } from 'fs';
import { join } from 'path';

export type PgauditStatusReport = {
  checkedAt: string;
  pgauditInstalled: boolean;
  compensatingControls?: boolean;
  version?: string | null;
  pgauditLog?: string | null;
  error?: string;
  status: 'compliant' | 'compensating' | 'gap';
  compensatingChecks?: string[];
  remediation?: string;
  operatorGate?: string;
};

const REQUIRED_ANCHORS = [
  'lib/compliance/record-audit.ts',
  'scripts/compliance/export-audit-trail.ts',
  'lib/utils/security-logger.ts',
  'scripts/security/run-preflight.ts',
  'lib/compliance/security-pack/preflight-checks.ts',
] as const;

export function assessCompensatingControls(root = process.cwd()): {
  ok: boolean;
  checks: string[];
  missing: string[];
} {
  const checks: string[] = [];
  const missing: string[] = [];

  for (const rel of REQUIRED_ANCHORS) {
    const path = join(root, rel);
    if (existsSync(path)) checks.push(rel);
    else missing.push(rel);
  }

  const preflightDir = join(root, 'compliance/evidence/security');
  if (existsSync(preflightDir)) {
    const preflight = readdirSync(preflightDir).some((f) => f.startsWith('preflight-') && f.endsWith('.json'));
    if (preflight) checks.push('compliance/evidence/security/preflight-*.json');
    else missing.push('compliance/evidence/security/preflight-*.json');
  } else {
    missing.push('compliance/evidence/security/');
  }

  return { ok: missing.length === 0, checks, missing };
}

export function isLoggingCompliant(
  report: Pick<PgauditStatusReport, 'pgauditInstalled' | 'compensatingControls' | 'status'>
): boolean {
  return report.pgauditInstalled === true || report.compensatingControls === true || report.status === 'compensating';
}

export function findLatestPgauditStatusPath(root = process.cwd()): string | null {
  const candidates: string[] = [];
  const evidenceRoot = join(root, 'compliance/evidence');

  const complianceDir = join(evidenceRoot, 'compliance');
  if (existsSync(complianceDir)) {
    for (const f of readdirSync(complianceDir)) {
      if (f.startsWith('pgaudit-status') && f.endsWith('.json')) {
        candidates.push(join(complianceDir, f));
      }
    }
  }

  if (existsSync(evidenceRoot)) {
    for (const entry of readdirSync(evidenceRoot, { withFileTypes: true })) {
      if (!entry.isDirectory() || !/^\d{4}-\d{2}$/.test(entry.name)) continue;
      const p = join(evidenceRoot, entry.name, 'pgaudit-status.json');
      if (existsSync(p)) candidates.push(p);
    }
  }

  if (candidates.length === 0) return null;
  candidates.sort();
  return candidates.at(-1) ?? null;
}

export function readLatestPgauditStatus(root = process.cwd()): PgauditStatusReport | null {
  const path = findLatestPgauditStatusPath(root);
  if (!path) return null;
  try {
    return JSON.parse(readFileSync(path, 'utf8')) as PgauditStatusReport;
  } catch {
    return null;
  }
}

export function pgauditEvidenceMonthPath(root = process.cwd()): { dir: string; file: string } {
  const month = new Date().toISOString().slice(0, 7);
  const dir = join(root, 'compliance/evidence', month);
  return { dir, file: join(dir, 'pgaudit-status.json') };
}
