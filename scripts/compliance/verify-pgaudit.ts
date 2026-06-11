#!/usr/bin/env npx tsx
/**
 * Verify pgAudit on Neon, or IMP-01 compensating controls when extension unavailable.
 * Location: scripts/compliance/verify-pgaudit.ts
 * Usage:
 *   npx tsx scripts/compliance/verify-pgaudit.ts [--json]
 *   npx tsx scripts/compliance/verify-pgaudit.ts --strict   # fail unless pgAudit installed
 *   npx tsx scripts/compliance/verify-pgaudit.ts --compensating-controls
 */

import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from 'fs';
import { join } from 'path';
import { execSync } from 'node:child_process';
import { neon } from '@neondatabase/serverless';
import {
  assessCompensatingControls,
  isLoggingCompliant,
  pgauditEvidenceMonthPath,
  type PgauditStatusReport,
} from '../../lib/compliance/pgaudit-evidence';

function loadEnv(): void {
  for (const file of ['.env.local', '.env']) {
    const path = join(process.cwd(), file);
    if (!existsSync(path)) continue;
    for (const line of readFileSync(path, 'utf8').split('\n')) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const idx = trimmed.indexOf('=');
      if (idx <= 0) continue;
      const key = trimmed.slice(0, idx).trim();
      const value = trimmed.slice(idx + 1).trim().replace(/^["']|["']$/g, '');
      if (!(key in process.env)) process.env[key] = value;
    }
  }
}

loadEnv();

function ensurePreflightEvidence(): void {
  const preflightDir = join(process.cwd(), 'compliance/evidence/security');
  const hasPreflight =
    existsSync(preflightDir) &&
    readdirSync(preflightDir).some((f) => f.startsWith('preflight-') && f.endsWith('.json'));
  if (hasPreflight) return;
  execSync('npm run security:preflight', { stdio: 'pipe', encoding: 'utf8', cwd: process.cwd() });
}

function buildCompensatingReport(
  checkedAt: string,
  pgauditError: string | undefined,
  version: string | null
): PgauditStatusReport {
  const { ok, checks, missing } = assessCompensatingControls();
  return {
    checkedAt,
    pgauditInstalled: false,
    compensatingControls: ok,
    version,
    error: pgauditError,
    status: ok ? 'compensating' : 'gap',
    compensatingChecks: checks,
    operatorGate: 'IMP-01',
    remediation: ok
      ? 'Neon pgAudit unavailable; application audit_trail + security preflight satisfy CC7.1 compensating controls'
      : `Compensating controls incomplete — missing: ${missing.join(', ')}`,
  };
}

async function main() {
  const jsonOnly = process.argv.includes('--json');
  const strict = process.argv.includes('--strict');
  const compensatingOnly =
    process.argv.includes('--compensating-controls') ||
    process.env.PGAUDIT_COMPENSATING_CONTROLS === 'true';

  const checkedAt = new Date().toISOString();
  const { dir: outDir, file: outPath } = pgauditEvidenceMonthPath();

  if (compensatingOnly && !process.env.DATABASE_URL && !process.env.DATABASE_URL_UNPOOLED) {
    ensurePreflightEvidence();
    const report = buildCompensatingReport(checkedAt, undefined, null);
    mkdirSync(outDir, { recursive: true });
    writeFileSync(outPath, JSON.stringify(report, null, 2));
    emit(report, jsonOnly, outPath);
    process.exit(isLoggingCompliant(report) ? 0 : 1);
  }

  const url = process.env.DATABASE_URL_UNPOOLED ?? process.env.DATABASE_URL;
  if (!url) {
    console.error('DATABASE_URL or DATABASE_URL_UNPOOLED required');
    process.exit(1);
  }

  const sql = neon(url);
  let extension: { extname: string; extversion: string }[] = [];
  let pgauditLog: string | null = null;
  let pgauditError: string | undefined;

  try {
    extension = await sql`
      SELECT extname, extversion::text
      FROM pg_extension
      WHERE extname = 'pgaudit'
    `;
    if (extension.length > 0) {
      const settings = await sql`SHOW pgaudit.log`;
      pgauditLog =
        (settings[0] as { pgaudit?: { log?: string } })?.pgaudit?.log ??
        (settings[0] as Record<string, string>)?.['pgaudit.log'] ??
        JSON.stringify(settings[0]);
    }
  } catch (e) {
    pgauditError = e instanceof Error ? e.message : String(e);
  }

  const installed = extension.length > 0;
  let report: PgauditStatusReport;

  if (installed) {
    report = {
      checkedAt,
      pgauditInstalled: true,
      compensatingControls: false,
      version: extension[0]?.extversion ?? null,
      pgauditLog,
      status: 'compliant',
      operatorGate: 'IMP-01',
    };
  } else if (strict) {
    report = {
      checkedAt,
      pgauditInstalled: false,
      status: 'gap',
      error: pgauditError,
      operatorGate: 'IMP-01',
      remediation: 'pgAudit not installed — remove --strict or enable pgAudit on Neon',
    };
  } else {
    ensurePreflightEvidence();
    report = buildCompensatingReport(
      checkedAt,
      pgauditError,
      extension[0]?.extversion ?? null
    );
  }

  mkdirSync(outDir, { recursive: true });
  writeFileSync(outPath, JSON.stringify(report, null, 2));

  emit(report, jsonOnly, outPath);
  process.exit(isLoggingCompliant(report) ? 0 : 1);
}

function emit(report: PgauditStatusReport, jsonOnly: boolean, outPath: string): void {
  if (jsonOnly) {
    console.log(JSON.stringify(report, null, 2));
    return;
  }
  if (report.pgauditInstalled) {
    console.log(`pgAudit installed: true (v${report.version ?? 'unknown'})`);
  } else if (report.compensatingControls) {
    console.log('pgAudit installed: false — IMP-01 compensating controls: PASS');
    console.log(`Checks: ${(report.compensatingChecks ?? []).join(', ')}`);
  } else {
    console.log('pgAudit installed: false — compensating controls: FAIL');
    console.log(report.remediation ?? report.error);
  }
  console.log(`Written: ${outPath}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
