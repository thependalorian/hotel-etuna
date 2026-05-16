#!/usr/bin/env npx tsx
/**
 * CLI: Run SOC 2 audit agents and print JSON report.
 * Usage: npx tsx scripts/compliance/soc2-audit.ts [--from=ISO] [--to=ISO]
 */

import { runSoc2Audit } from '../../lib/compliance/soc2/soc2-audit-engine';

function parseArg(name: string): string | undefined {
  const hit = process.argv.find((a) => a.startsWith(`--${name}=`));
  return hit?.split('=')[1];
}

async function main() {
  const fromRaw = parseArg('from');
  const toRaw = parseArg('to');
  const to = toRaw ? new Date(toRaw) : new Date();
  const from = fromRaw
    ? new Date(fromRaw)
    : new Date(to.getFullYear(), to.getMonth() - 3, to.getDate());

  const report = await runSoc2Audit({ from, to });
  console.log(JSON.stringify(report, null, 2));
  process.exit(report.summary.gap > 0 ? 1 : 0);
}

main().catch((err) => {
  console.error(err);
  process.exit(2);
});
