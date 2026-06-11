#!/usr/bin/env npx tsx
/**
 * CLI — run SOC 2 evidence agents and write JSON report.
 * Usage: npx tsx scripts/soc2/collect-evidence.ts [--from=YYYY-MM-DD] [--to=YYYY-MM-DD]
 * Location: scripts/soc2/collect-evidence.ts
 */

import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'fs';
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

function parseArg(name: string): string | undefined {
  const prefix = `--${name}=`;
  const hit = process.argv.find((a) => a.startsWith(prefix));
  return hit?.slice(prefix.length);
}

async function main() {
  const { soc2AuditOrchestrator } = await import(
    '../../lib/compliance/soc2/Soc2AuditOrchestrator'
  );
  const { securityLogger } = await import('@/lib/utils/security-logger');

  const to = parseArg('to') ? new Date(parseArg('to')!) : new Date();
  const from = parseArg('from')
    ? new Date(parseArg('from')!)
    : new Date(to.getTime() - 90 * 24 * 60 * 60 * 1000);

  securityLogger.info(`Running SOC 2 agents (${from.toISOString()} → ${to.toISOString()})…`);

  const report = await soc2AuditOrchestrator.runAudit({ periodFrom: from, periodTo: to });

  const outDir = join(process.cwd(), 'compliance/evidence/soc2');
  mkdirSync(outDir, { recursive: true });
  const stamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
  const outPath = join(outDir, `soc2_audit_${stamp}.json`);
  writeFileSync(outPath, JSON.stringify(report, null, 2), 'utf8');

  securityLogger.info(`Overall score: ${report.overallScorePercent}%`);
  securityLogger.info(
    `Controls: ${report.summary.compliant} compliant, ${report.summary.partial} partial, ${report.summary.gap} gap`
  );
  securityLogger.info(`Written: ${outPath}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
