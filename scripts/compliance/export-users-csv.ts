#!/usr/bin/env npx tsx
/**
 * Export users CSV for monthly SOC 2 evidence (no password hashes).
 * Location: scripts/compliance/export-users-csv.ts
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
  const month = process.argv.find((a) => a.startsWith('--month='))?.slice(8)
    ?? new Date().toISOString().slice(0, 7);
  const outDir = join(process.cwd(), 'compliance/evidence', month);
  mkdirSync(outDir, { recursive: true });
  const outPath = join(outDir, 'users-export.csv');

  const rows = await db
    .select({
      id: users.id,
      email: users.email,
      role: users.role,
      tenantId: users.tenantId,
      status: users.status,
      isPlatformAdmin: users.isPlatformAdmin,
      lastLoginAt: users.lastLoginAt,
    })
    .from(users);

  const header = 'id,email,role,tenant_id,status,is_platform_admin,last_login_at';
  const lines = rows.map((r) =>
    [
      r.id,
      r.email,
      r.role ?? '',
      r.tenantId ?? '',
      r.status ?? '',
      r.isPlatformAdmin ? 'true' : 'false',
      r.lastLoginAt?.toISOString() ?? '',
    ].join(',')
  );
  writeFileSync(outPath, [header, ...lines].join('\n'));
  console.log(`Exported ${rows.length} users → ${outPath}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
