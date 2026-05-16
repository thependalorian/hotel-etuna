#!/usr/bin/env npx tsx
/**
 * Security Prompt Pack — Deployment Pre-Flight (§15).
 * Usage: npx tsx scripts/security/run-preflight.ts [--json]
 */

import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { execSync } from 'node:child_process';
import { runSecurityPreflightChecks } from '../../lib/compliance/security-pack/preflight-checks';

const jsonOnly = process.argv.includes('--json');

function main() {
  const report = runSecurityPreflightChecks();

  let npmAuditNote = 'skipped';
  try {
    execSync('npm audit --audit-level=critical --json', {
      encoding: 'utf-8',
      stdio: ['pipe', 'pipe', 'pipe'],
    });
    npmAuditNote = '0 critical';
  } catch (e: unknown) {
    const err = e as { stdout?: string };
    if (err.stdout) {
      try {
        const parsed = JSON.parse(err.stdout) as {
          metadata?: { vulnerabilities?: { critical?: number } };
        };
        const critical = parsed.metadata?.vulnerabilities?.critical ?? -1;
        npmAuditNote = critical === 0 ? '0 critical' : `${critical} critical — run npm audit fix`;
        if (critical > 0) {
          report.summary.fail += 1;
          report.checks.push({
            id: 'PF-12',
            section: 12,
            title: 'npm audit — no critical vulnerabilities',
            status: 'fail',
            detail: npmAuditNote,
            remediation: 'npm audit fix && npm test',
          });
        } else if (critical === 0) {
          report.checks.push({
            id: 'PF-12',
            section: 12,
            title: 'npm audit — no critical vulnerabilities',
            status: 'pass',
            detail: npmAuditNote,
          });
        }
      } catch {
        npmAuditNote = 'audit parse failed';
      }
    }
  }

  const outDir = join(process.cwd(), 'compliance/evidence/security');
  mkdirSync(outDir, { recursive: true });
  const outPath = join(outDir, `preflight-${report.generatedAt.slice(0, 10)}.json`);
  writeFileSync(outPath, JSON.stringify(report, null, 2));

  if (jsonOnly) {
    console.log(JSON.stringify(report, null, 2));
    process.exit(report.summary.fail > 0 ? 1 : 0);
  }

  console.log(`\n🔐 Hotel Etuna Security Pre-Flight — ${report.scorePercent}%`);
  console.log(`   Pass: ${report.summary.pass}  Warn: ${report.summary.warn}  Fail: ${report.summary.fail}`);
  console.log(`   npm audit: ${npmAuditNote}`);
  console.log(`   Evidence: ${outPath}\n`);

  for (const c of report.checks) {
    const icon = c.status === 'pass' ? '✅' : c.status === 'warn' ? '⚠️' : '❌';
    console.log(`${icon} [${c.id}] ${c.title}`);
    console.log(`   ${c.detail}`);
  }

  process.exit(report.summary.fail > 0 ? 1 : 0);
}

main();
