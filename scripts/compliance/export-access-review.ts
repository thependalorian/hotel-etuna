#!/usr/bin/env npx tsx
/**
 * Export users for quarterly access review (CC6.3).
 * Location: scripts/compliance/export-access-review.ts
 * Usage: npx tsx scripts/compliance/export-access-review.ts [--out=path]
 */

import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'fs';
import { join } from 'path';
import { db, users } from '@/lib/db';

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

async function main() {
  const stamp = new Date().toISOString().slice(0, 10);
  const defaultOut = join(
    process.cwd(),
    'compliance/evidence',
    stamp.slice(0, 7),
    `access-review-${stamp}.json`
  );
  const outArg = process.argv.find((a) => a.startsWith('--out='));
  const outPath = outArg ? outArg.slice(6) : defaultOut;

  const rows = await db
    .select({
      id: users.id,
      email: users.email,
      role: users.role,
      tenantId: users.tenantId,
      isPlatformAdmin: users.isPlatformAdmin,
      status: users.status,
      lastLoginAt: users.lastLoginAt,
      createdAt: users.createdAt,
    })
    .from(users);

  const report = {
    generatedAt: new Date().toISOString(),
    reviewPeriod: `Q2 2026`,
    totalUsers: rows.length,
    byRole: rows.reduce<Record<string, number>>((acc, r) => {
      const key = r.role ?? 'unknown';
      acc[key] = (acc[key] ?? 0) + 1;
      return acc;
    }, {}),
    users: rows.map((r) => ({
      id: r.id,
      email: r.email,
      role: r.role,
      tenantId: r.tenantId,
      isPlatformAdmin: r.isPlatformAdmin,
      status: r.status,
      lastLoginAt: r.lastLoginAt?.toISOString() ?? null,
    })),
    attestation: {
      reviewer: 'CTO',
      signed: false,
      notes: 'Manager attestation required — sign printed copy or DocuSign',
    },
  };

  mkdirSync(join(outPath, '..'), { recursive: true });
  writeFileSync(outPath, JSON.stringify(report, null, 2));
  console.log(`Access review export: ${rows.length} users → ${outPath}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
