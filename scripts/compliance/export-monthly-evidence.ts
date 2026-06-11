#!/usr/bin/env npx tsx
/**
 * Bundle monthly SOC 2 evidence pack into compliance/evidence/YYYY-MM/.
 * Location: scripts/compliance/export-monthly-evidence.ts
 * Usage: npx tsx scripts/compliance/export-monthly-evidence.ts [--month=YYYY-MM]
 */

import { execSync } from 'child_process';
import { existsSync, readFileSync, writeFileSync, mkdirSync, copyFileSync, readdirSync } from 'fs';
import { join } from 'path';

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

function parseMonth(): string {
  const arg = process.argv.find((a) => a.startsWith('--month='));
  if (arg) return arg.slice(8);
  return new Date().toISOString().slice(0, 7);
}

function run(cmd: string): void {
  console.log(`> ${cmd}`);
  execSync(cmd, { stdio: 'inherit', cwd: process.cwd() });
}

async function main() {
  const month = parseMonth();
  const [y, m] = month.split('-').map(Number);
  const from = new Date(y, m - 1, 1);
  const to = new Date(y, m, 0, 23, 59, 59);
  const fromStr = from.toISOString().slice(0, 10);
  const toStr = to.toISOString().slice(0, 10);

  const outDir = join(process.cwd(), 'compliance/evidence', month);
  mkdirSync(outDir, { recursive: true });
  mkdirSync(join(outDir, 'access'), { recursive: true });

  const manifest: Record<string, unknown> = {
    month,
    generatedAt: new Date().toISOString(),
    artifacts: [] as string[],
  };

  const add = (rel: string) => {
    (manifest.artifacts as string[]).push(rel);
  };

  // Security preflight
  try {
    run('npx tsx scripts/security/run-preflight.ts --json');
    const preflightDir = join(process.cwd(), 'compliance/evidence/security');
    if (existsSync(preflightDir)) {
      const latest = readdirSync(preflightDir)
        .filter((f) => f.startsWith('preflight-') && f.endsWith('.json'))
        .sort()
        .pop();
      if (latest) {
        const dest = join(outDir, latest);
        copyFileSync(join(preflightDir, latest), dest);
        add(`compliance/evidence/${month}/${latest}`);
      }
    }
  } catch {
    manifest.preflightError = 'preflight failed — check logs';
  }

  // SOC2 agents
  try {
    run(`npx tsx scripts/soc2/collect-evidence.ts --from=${fromStr} --to=${toStr}`);
    const soc2Dir = join(process.cwd(), 'compliance/evidence/soc2');
    const latestSoc2 = readdirSync(soc2Dir)
      .filter((f) => f.startsWith('soc2_audit_') && f.endsWith('.json'))
      .sort()
      .pop();
    if (latestSoc2) {
      const dest = join(outDir, latestSoc2);
      copyFileSync(join(soc2Dir, latestSoc2), dest);
      add(`compliance/evidence/${month}/${latestSoc2}`);
    }
  } catch {
    manifest.soc2Error = 'collect-evidence failed';
  }

  // npm audit snapshot
  try {
    const auditJson = execSync('npm audit --json', { encoding: 'utf8' });
    const auditPath = join(outDir, `npm-audit-${month}.json`);
    writeFileSync(auditPath, auditJson);
    add(`compliance/evidence/${month}/npm-audit-${month}.json`);
  } catch (e: unknown) {
    const err = e as { stdout?: string };
    if (err.stdout) {
      const auditPath = join(outDir, `npm-audit-${month}.json`);
      writeFileSync(auditPath, err.stdout);
      add(`compliance/evidence/${month}/npm-audit-${month}.json`);
    }
  }

  // DB exports (require DATABASE_URL)
  if (process.env.DATABASE_URL) {
    try {
      run(`npx tsx scripts/compliance/export-audit-trail.ts --from=${fromStr} --to=${toStr}`);
      add(`compliance/evidence/${month}/audit_trail-export.csv`);
    } catch {
      manifest.auditTrailError = 'export-audit-trail failed';
    }
    try {
      run(`npx tsx scripts/compliance/export-access-review.ts --out=${join(outDir, `access-review-${toStr}.json`)}`);
      add(`compliance/evidence/${month}/access-review-${toStr}.json`);
    } catch {
      manifest.accessReviewError = 'export-access-review failed';
    }
    try {
      run('npx tsx scripts/compliance/verify-pgaudit.ts --json');
      add(`compliance/evidence/${month}/pgaudit-status.json`);
    } catch {
      manifest.pgauditNote = 'pgAudit not yet enabled — see enable-pgaudit.sql';
    }
  } else {
    manifest.databaseNote = 'DATABASE_URL not set — skipped DB exports';
  }

  // Vendor attestation reminder (G-09)
  const vendorReceivedDir = join(process.cwd(), 'compliance/evidence/vendor-attestations/received');
  const vendorOutboxDir = join(process.cwd(), 'compliance/evidence/vendor-attestations/outbox');
  const vendorPdfs = existsSync(vendorReceivedDir)
    ? readdirSync(vendorReceivedDir).filter((f) => f.endsWith('.pdf'))
    : [];
  const vendorPending = existsSync(vendorOutboxDir)
    ? readdirSync(vendorOutboxDir).filter((f) => f.endsWith('.md'))
    : [];
  manifest.vendorAttestations = {
    receivedCount: vendorPdfs.length,
    pendingOutbox: vendorPending.length,
    action:
      vendorPdfs.length >= 2
        ? 'ok'
        : 'Follow up Adumo PCI + Vercel SOC2 requests in vendor-attestations/outbox/',
  };

  // README for auditors
  const readme = `# Monthly evidence pack — ${month}

Generated: ${new Date().toISOString()}

## Contents

${(manifest.artifacts as string[]).map((a) => `- ${a}`).join('\n')}

## Manual additions (CTO)

- Platform MFA screenshots → \`access/\`
- Weekly log review notes → \`../log-reviews/\`
- Vendor attestations unchanged in \`../vendor-attestations/received/\`
`;
  writeFileSync(join(outDir, 'README.md'), readme);
  writeFileSync(join(outDir, 'manifest.json'), JSON.stringify(manifest, null, 2));

  console.log(`\nMonthly pack ready: compliance/evidence/${month}/`);
  console.log(`Artifacts: ${(manifest.artifacts as string[]).length}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
