/**
 * Seed cms_menu_items.image_url with mid-size thumbnail URLs (480px).
 * Usage: npx tsx scripts/seed-menu-images.ts [--force]
 */

import { config } from 'dotenv';
import {
  createMenuImagesSql,
  fetchMenuItemsFromDb,
  seedMenuItemImages,
} from './lib/menu-images-db';
import { MENU_IMAGE_THUMB_WIDTH } from '../lib/data/menu-image-thumb';

config({ path: '.env.local' });
config();

async function main() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    console.error('DATABASE_URL is required');
    process.exit(1);
  }

  const force = process.argv.includes('--force');
  const sql = createMenuImagesSql(databaseUrl);

  console.log(`Seeding menu thumbnails (${MENU_IMAGE_THUMB_WIDTH}px wide)…`);
  if (force) console.log('  --force: overwriting all image_url values');

  const { updated, skippedNoMatch, catalogUrls } = await seedMenuItemImages(sql, { force });
  const rows = await fetchMenuItemsFromDb(sql);
  const withImage = rows.filter((r) => r.image_url?.trim()).length;

  console.log(`Catalog image map: ${catalogUrls} items`);
  console.log(`DB rows updated: ${updated}`);
  console.log(`DB rows total: ${rows.length}`);
  console.log(`DB rows with image_url: ${withImage}`);
  if (skippedNoMatch > 0) {
    console.warn(`  ${skippedNoMatch} DB row(s) not in catalog (used category fallback URL)`);
  }

  if (withImage < rows.length) {
    console.warn(`  ${rows.length - withImage} row(s) still missing image_url`);
    process.exit(1);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
