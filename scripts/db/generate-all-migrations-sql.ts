/**
 * Concatenate Drizzle journal SQL into database/all-migrations.sql for Neon console runs.
 * Location: scripts/db/generate-all-migrations-sql.ts
 *
 * Usage: npx tsx scripts/db/generate-all-migrations-sql.ts
 */

import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

const root = resolve(process.cwd());
const journalPath = resolve(root, 'database/drizzle/meta/_journal.json');
const outPath = resolve(root, 'database/all-migrations.sql');

function main(): void {
  const journal = JSON.parse(readFileSync(journalPath, 'utf8')) as {
    entries: Array<{ tag: string }>;
  };

  const parts: string[] = [
    '-- Hotel Etuna — consolidated migrations (generated; prefer npm run db:migrate:all)',
    `-- Generated: ${new Date().toISOString()}`,
    'BEGIN;',
    '',
  ];

  for (const entry of journal.entries) {
    const file = `${entry.tag}.sql`;
    const path = resolve(root, 'database/drizzle', file);
    if (!existsSync(path)) {
      throw new Error(`Missing migration file: ${file}`);
    }
    parts.push(`-- === ${file} ===`);
    parts.push(readFileSync(path, 'utf8').trim());
    parts.push('');
  }

  parts.push('COMMIT;', '');
  writeFileSync(outPath, parts.join('\n'), 'utf8');
  console.log(`Wrote ${outPath} (${journal.entries.length} migrations)`);
}

main();
