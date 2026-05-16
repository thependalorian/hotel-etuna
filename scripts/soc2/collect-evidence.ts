#!/usr/bin/env npx tsx
/**
 * CLI — run SOC 2 evidence agents and write JSON report.
 * Usage: npx tsx scripts/soc2/collect-evidence.ts [--from=YYYY-MM-DD] [--to=YYYY-MM-DD]
 * Location: scripts/soc2/collect-evidence.ts
 */

import { writeFileSync, mkdirSync } from 'fs';
import { join } from 'path';
import { soc2AuditOrchestrator } from '../../lib/compliance/soc2/Soc2AuditOrchestrator';

function parseArg(name: string): string | undefined {
  const prefix = `--${name}=`;
  const hit = process.argv.find((a) => a.startsWith(prefix));
  return hit?.slice(prefix.length);
}

async function main() {
  const to = parseArg('to') ? new Date(parseArg('to')!) : new Date();
  const from = parseArg('from')
    ? new Date(parseArg('from')!)
    : new Date(to.getTime() - 90 * 24 * 60 * 60 * 1000);

  console.log(`Running SOC 2 agents (${from.toISOString()} → ${to.toISOString()})…`);

  const report = await soc2AuditOrchestrator.runAudit({ periodFrom: from, periodTo: to });

  const outDir = join(process.cwd(), 'compliance/evidence/soc2');
  mkdirSync(outDir, { recursive: true });
  const stamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
  const outPath = join(outDir, `soc2_audit_${stamp}.json`);
  writeFileSync(outPath, JSON.stringify(report, null, 2), 'utf8');

  console.log(`Overall score: ${report.overallScorePercent}%`);
  console.log(
    `Controls: ${report.summary.compliant} compliant, ${report.summary.partial} partial, ${report.summary.gap} gap`
  );
  console.log(`Written: ${outPath}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
