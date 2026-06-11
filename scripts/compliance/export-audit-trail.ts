#!/usr/bin/env npx tsx
/**
 * Export audit_trail rows for monthly SOC 2 evidence (CC7.1).
 * Location: scripts/compliance/export-audit-trail.ts
 * Usage: npx tsx scripts/compliance/export-audit-trail.ts [--from=YYYY-MM-DD] [--to=YYYY-MM-DD]
 */

import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'fs';
import { join } from 'path';
import { db, auditTrail } from '@/lib/db';
import { and, gte, lte } from 'drizzle-orm';

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
  return process.argv.find((a) => a.startsWith(prefix))?.slice(prefix.length);
}

function toCsv(rows: Record<string, unknown>[]): string {
  if (rows.length === 0) return 'id,tenant_id,action,resource_type,timestamp\n';
  const keys = Object.keys(rows[0]);
  const lines = [keys.join(',')];
  for (const row of rows) {
    lines.push(
      keys
        .map((k) => {
          const v = row[k];
          const s = v == null ? '' : String(v);
          return s.includes(',') || s.includes('"') ? `"${s.replace(/"/g, '""')}"` : s;
        })
        .join(',')
    );
  }
  return lines.join('\n');
}

async function main() {
  const to = parseArg('to') ? new Date(parseArg('to')!) : new Date();
  const from = parseArg('from')
    ? new Date(parseArg('from')!)
    : new Date(to.getFullYear(), to.getMonth(), 1);

  const rows = await db
    .select({
      id: auditTrail.id,
      tenantId: auditTrail.tenantId,
      action: auditTrail.action,
      resourceType: auditTrail.resourceType,
      resourceId: auditTrail.resourceId,
      timestamp: auditTrail.timestamp,
    })
    .from(auditTrail)
    .where(and(gte(auditTrail.timestamp, from), lte(auditTrail.timestamp, to)))
    .limit(50000);

  const month = from.toISOString().slice(0, 7);
  const outDir = join(process.cwd(), 'compliance/evidence', month);
  mkdirSync(outDir, { recursive: true });
  const csvPath = join(outDir, 'audit_trail-export.csv');
  const metaPath = join(outDir, 'audit_trail-export-meta.json');

  writeFileSync(csvPath, toCsv(rows as Record<string, unknown>[]));
  writeFileSync(
    metaPath,
    JSON.stringify(
      {
        exportedAt: new Date().toISOString(),
        periodFrom: from.toISOString(),
        periodTo: to.toISOString(),
        rowCount: rows.length,
        csvPath: `compliance/evidence/${month}/audit_trail-export.csv`,
      },
      null,
      2
    )
  );

  console.log(`Exported ${rows.length} audit_trail rows → ${csvPath}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
