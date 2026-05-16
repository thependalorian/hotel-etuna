/**
 * Validate menu image URLs: thumb size, DB coverage, HTTP reachability.
 * Usage: npx tsx scripts/validate-menu-images.ts [--skip-http]
 */

import { config } from 'dotenv';
import { createMenuImagesSql, validateMenuItemImages } from './lib/menu-images-db';
import { MENU_IMAGE_THUMB_WIDTH } from '../lib/data/menu-image-thumb';

config({ path: '.env.local' });
config();

function printFailures(
  label: string,
  items: { name: string; url?: string; status?: number | string }[] | string[],
) {
  if (items.length === 0) return;
  console.error(`\n${label} (${items.length}):`);
  for (const item of items.slice(0, 15)) {
    if (typeof item === 'string') {
      console.error(`  - ${item}`);
    } else {
      console.error(`  - ${item.name}: ${item.status ?? ''} ${item.url ?? ''}`);
    }
  }
  if (items.length > 15) console.error(`  … and ${items.length - 15} more`);
}

async function main() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    console.error('DATABASE_URL is required');
    process.exit(1);
  }

  const skipHttp = process.argv.includes('--skip-http');
  const sql = createMenuImagesSql(databaseUrl);

  console.log(`Validating menu images (expected thumb width ≤ ${MENU_IMAGE_THUMB_WIDTH}px)…`);

  const result = await validateMenuItemImages(sql, { checkHttp: !skipHttp });

  console.log(`DB: ${result.dbWithImage}/${result.dbTotal} with image_url`);

  printFailures(
    'Missing image_url in DB',
    result.dbMissingImage.map((r) => ({ name: r.name })),
  );
  printFailures(
    'DB URLs not thumb-sized',
    result.dbNonThumbUrls.map((r) => ({ name: r.name, url: r.image_url ?? '' })),
  );
  printFailures('Catalog URLs not thumb-sized', result.catalogNonThumb);
  printFailures('Catalog URL HTTP failures', result.catalogFetchFailed);
  printFailures('DB URL HTTP failures', result.dbFetchFailed);

  if (result.ok) {
    console.log('\n✓ Menu images validation passed');
    return;
  }

  console.error('\n✗ Menu images validation failed');
  process.exit(1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
