#!/usr/bin/env npx tsx
/**
 * Attempt pgAudit extension enablement on Neon (IMP-01).
 * Location: scripts/compliance/enable-pgaudit.ts
 * Usage: npm run enable:pgaudit
 *
 * ALTER SYSTEM requires superuser — this script only runs CREATE EXTENSION IF NOT EXISTS.
 * Full config: scripts/compliance/enable-pgaudit.sql via Neon console / support ticket.
 */

import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs';
import { join } from 'path';
import { neon } from '@neondatabase/serverless';

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

async function main(): Promise<void> {
  loadEnv();
  const url = process.env.DATABASE_URL_UNPOOLED ?? process.env.DATABASE_URL;
  if (!url) {
    console.error('DATABASE_URL or DATABASE_URL_UNPOOLED required');
    process.exit(1);
  }

  const sql = neon(url);
  const report: Record<string, unknown> = {
    executedAt: new Date().toISOString(),
    createExtension: null as string | null,
    extension: null as unknown,
    showPgauditLog: null as unknown,
    error: null as string | null,
  };

  try {
    await sql`CREATE EXTENSION IF NOT EXISTS pgaudit`;
    report.createExtension = 'ok';
    report.extension = await sql`
      SELECT extname, extversion::text AS extversion
      FROM pg_extension
      WHERE extname = 'pgaudit'
    `;
    try {
      report.showPgauditLog = await sql`SHOW pgaudit.log`;
    } catch (showErr) {
      report.showPgauditLog = {
        error: showErr instanceof Error ? showErr.message : String(showErr),
        note: 'Session GUC may require Neon support / ALTER SYSTEM from enable-pgaudit.sql',
      };
    }
  } catch (e) {
    report.error = e instanceof Error ? e.message : String(e);
    report.remediation =
      'Neon pgAudit unavailable without platform enablement — run npm run verify:pgaudit for compensating controls';
  }

  const month = new Date().toISOString().slice(0, 7);
  const outDir = join(process.cwd(), 'compliance/evidence/compliance');
  mkdirSync(outDir, { recursive: true });
  const outPath = join(outDir, `pgaudit-enable-attempt-${new Date().toISOString().slice(0, 10)}.json`);
  writeFileSync(outPath, JSON.stringify(report, null, 2));

  console.log(JSON.stringify(report, null, 2));
  console.log(`Written: ${outPath}`);

  const installed =
    Array.isArray(report.extension) && (report.extension as unknown[]).length > 0;
  process.exit(installed ? 0 : 1);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
