#!/usr/bin/env npx tsx
/**
 * Execute + validate Hotel Etuna audit wave 6 gates (2026-06-11).
 * Location: scripts/compliance/run-audit-validation.ts
 * Usage: npm run validate:audit-wave6
 */

import { execSync } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

type StepResult = {
  step: string;
  command: string;
  status: 'pass' | 'fail' | 'warn';
  detail?: string;
};

const results: StepResult[] = [];

function run(step: string, command: string, allowFail = false): void {
  try {
    execSync(command, { stdio: 'pipe', encoding: 'utf8', cwd: process.cwd() });
    results.push({ step, command, status: 'pass' });
    console.log(`✅ ${step}`);
  } catch (error) {
    const err = error as { stdout?: string; stderr?: string; message?: string };
    const detail = (err.stderr || err.stdout || err.message || '').trim().slice(0, 500);
    results.push({
      step,
      command,
      status: allowFail ? 'warn' : 'fail',
      detail,
    });
    console.log(`${allowFail ? '⚠️' : '❌'} ${step}${detail ? `: ${detail.split('\n')[0]}` : ''}`);
    if (!allowFail) {
      writeReport();
      process.exit(1);
    }
  }
}

function writeReport(): void {
  const outDir = join(process.cwd(), 'compliance/evidence/security');
  mkdirSync(outDir, { recursive: true });
  const path = join(outDir, `audit-wave6-validation-${new Date().toISOString().slice(0, 10)}.json`);
  const summary = {
    generatedAt: new Date().toISOString(),
    pass: results.filter((r) => r.status === 'pass').length,
    warn: results.filter((r) => r.status === 'warn').length,
    fail: results.filter((r) => r.status === 'fail').length,
    steps: results,
  };
  writeFileSync(path, JSON.stringify(summary, null, 2));
  console.log(`\nReport: ${path}`);
}

console.log('=== Audit wave 6 — execute then validate ===\n');

run('TypeScript', 'npx tsc --noEmit');
run('Security preflight (§15)', 'npm run security:preflight');
run('Security audit evidence (Gap 12)', 'npm run security:audit-report', true);
run('RLS isolation', 'npm run test:db:rls');
run('Adumo Virtual staging', 'npm run validate:adumo');
run('pgAudit enable attempt (IMP-01)', 'npm run enable:pgaudit', true);
run('pgAudit verify', 'npm run verify:pgaudit', true);
run('CSP unit tests', 'npx vitest run tests/unit/content-security-policy.test.ts');
run('Sofia intent + email', 'npx vitest run tests/unit/sofia-intent-resolve.test.ts tests/sofia/sofia-email.test.ts');
run(
  'Accounting + SOC2',
  'npx vitest run tests/unit/namibia-hospitality-accounting.test.ts tests/unit/soc2-audit.test.ts',
);

writeReport();
const failed = results.filter((r) => r.status === 'fail').length;
const warned = results.filter((r) => r.status === 'warn').length;
console.log(`\nDone: ${results.length - failed - warned} pass, ${warned} warn, ${failed} fail`);
process.exit(failed > 0 ? 1 : 0);
