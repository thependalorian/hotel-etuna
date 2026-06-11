#!/usr/bin/env npx tsx
/**
 * Capture npm audit JSON for compliance evidence (Gap 12).
 * Location: scripts/security/capture-npm-audit.ts
 * Usage: npm run security:audit-report
 */

import { execSync } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const OUT_DIR = join(process.cwd(), 'compliance/evidence/security');
const date = new Date().toISOString().slice(0, 10);

function main(): void {
  mkdirSync(OUT_DIR, { recursive: true });
  let raw = '';
  try {
    raw = execSync('npm audit --json', { encoding: 'utf8', maxBuffer: 10 * 1024 * 1024 });
  } catch (error) {
    const err = error as { stdout?: string; status?: number };
    raw = err.stdout ?? '';
    if (!raw) throw error;
  }
  const audit = JSON.parse(raw) as {
    metadata?: {
      vulnerabilities?: {
        info?: number;
        low?: number;
        moderate?: number;
        high?: number;
        critical?: number;
      };
    };
  };

  const vulns = audit.metadata?.vulnerabilities ?? {};
  const summary = {
    generatedAt: new Date().toISOString(),
    critical: vulns.critical ?? 0,
    high: vulns.high ?? 0,
    moderate: vulns.moderate ?? 0,
    low: vulns.low ?? 0,
    info: vulns.info ?? 0,
    acceptedRiskNotes: [
      'langsmith/@langchain/* — fix requires major bump (npm audit fix --force); Sofia graph only',
      'elliptic via @stackframe/stack — no fix available; monitor Stack Auth releases',
      'esbuild via drizzle-kit — dev-time only; upgrade drizzle-kit on schedule',
      'uuid transitive — ignored in dependabot until upstream majors land',
    ],
    remediation: 'Review Dependabot PRs weekly; do not run npm audit fix --force in CI',
  };

  const outPath = join(OUT_DIR, `npm-audit-${date}.json`);
  writeFileSync(outPath, JSON.stringify({ summary, audit }, null, 2));
  console.log(`Wrote ${outPath}`);
  console.log(
    `Vulnerabilities: critical=${summary.critical} high=${summary.high} moderate=${summary.moderate}`,
  );
  if ((summary.critical ?? 0) > 0) process.exit(1);
}

main();
