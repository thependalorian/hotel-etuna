/**
 * Shared DB helpers for menu image seed + validate scripts.
 * Location: scripts/lib/menu-images-db.ts
 */

import { neon } from '@neondatabase/serverless';
import { ETUNA_MENU_ITEMS } from '../../lib/data/etuna-restaurant-menu-catalog';
import { getMenuItemImageUrlForSeed } from '../../lib/data/menu-item-image-urls';
import { isMenuThumbUrl } from '../../lib/data/menu-image-thumb';

export type MenuImageDbRow = {
  id: string;
  name: string;
  category_name: string | null;
  image_url: string | null;
};

export type MenuImageSeedResult = {
  updated: number;
  skippedNoMatch: number;
  catalogUrls: number;
};

export type MenuImageValidateResult = {
  ok: boolean;
  dbTotal: number;
  dbWithImage: number;
  dbMissingImage: MenuImageDbRow[];
  dbNonThumbUrls: MenuImageDbRow[];
  catalogNonThumb: string[];
  catalogFetchFailed: { name: string; url: string; status: number | string }[];
  dbFetchFailed: { name: string; url: string; status: number | string }[];
};

export function createMenuImagesSql(databaseUrl: string) {
  return neon(databaseUrl);
}

export async function fetchMenuItemsFromDb(
  sql: ReturnType<typeof neon>,
): Promise<MenuImageDbRow[]> {
  const rows = await sql`
    SELECT
      m.id,
      m.name,
      c.name AS category_name,
      m.image_url
    FROM cms_menu_items m
    LEFT JOIN menu_categories c ON c.id = m.category_id
    ORDER BY c.display_order NULLS LAST, m.name
  `;
  return rows as MenuImageDbRow[];
}

export function resolveSeedImageUrl(name: string, categoryName: string | null): string {
  return getMenuItemImageUrlForSeed(name, categoryName ?? 'Main Course');
}

export async function seedMenuItemImages(
  sql: ReturnType<typeof neon>,
  options: { force?: boolean } = {},
): Promise<MenuImageSeedResult> {
  const force = options.force ?? false;
  const dbRows = await fetchMenuItemsFromDb(sql);
  let updated = 0;
  let skippedNoMatch = 0;

  const catalogByName = new Map(
    ETUNA_MENU_ITEMS.map((item) => [item.name, item] as const),
  );

  for (const row of dbRows) {
    const catalogItem = catalogByName.get(row.name);
    if (!catalogItem) skippedNoMatch += 1;

    const categoryName = row.category_name ?? catalogItem?.categoryName ?? 'Main Course';
    const imageUrl = resolveSeedImageUrl(row.name, categoryName);
    const current = row.image_url?.trim() ?? '';
    const shouldUpdate = force || !current || !isMenuThumbUrl(current);
    if (!shouldUpdate) continue;

    const result = await sql`
      UPDATE cms_menu_items
      SET image_url = ${imageUrl}, updated_at = NOW()
      WHERE id = ${row.id}
      RETURNING id
    `;
    if (result.length > 0) updated += 1;
  }

  return {
    updated,
    skippedNoMatch,
    catalogUrls: ETUNA_MENU_ITEMS.length,
  };
}

async function headCheckUrl(
  url: string,
  timeoutMs = 12_000,
): Promise<{ ok: boolean; status: number | string }> {
  try {
    const response = await fetch(url, {
      method: 'GET',
      signal: AbortSignal.timeout(timeoutMs),
      redirect: 'follow',
      headers: {
        Range: 'bytes=0-1023',
        'User-Agent': 'HotelEtuna-MenuValidator/1.0',
      },
    });
    return { ok: response.ok, status: response.status };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'fetch failed';
    return { ok: false, status: message };
  }
}

async function checkUrlsBatch(
  entries: { name: string; url: string }[],
  concurrency = 8,
): Promise<{ name: string; url: string; status: number | string }[]> {
  const failed: { name: string; url: string; status: number | string }[] = [];
  let index = 0;

  async function worker() {
    while (index < entries.length) {
      const current = entries[index];
      index += 1;
      if (!current) continue;
      const { ok, status } = await headCheckUrl(current.url);
      if (!ok) failed.push({ name: current.name, url: current.url, status });
    }
  }

  await Promise.all(
    Array.from({ length: Math.min(concurrency, entries.length) }, () => worker()),
  );
  return failed;
}

export async function validateMenuItemImages(
  sql: ReturnType<typeof neon>,
  options: { checkHttp?: boolean } = {},
): Promise<MenuImageValidateResult> {
  const checkHttp = options.checkHttp ?? true;
  const dbRows = await fetchMenuItemsFromDb(sql);

  const dbMissingImage = dbRows.filter((r) => !r.image_url?.trim());
  const dbNonThumbUrls = dbRows.filter(
    (r) => r.image_url?.trim() && !isMenuThumbUrl(r.image_url),
  );

  const catalogNonThumb = ETUNA_MENU_ITEMS.filter((item) => {
    const url = getMenuItemImageUrlForSeed(item.name, item.categoryName);
    return !isMenuThumbUrl(url);
  }).map((item) => item.name);

  let catalogFetchFailed: MenuImageValidateResult['catalogFetchFailed'] = [];
  let dbFetchFailed: MenuImageValidateResult['dbFetchFailed'] = [];

  if (checkHttp) {
    const catalogUrls = ETUNA_MENU_ITEMS.map((item) => ({
      name: item.name,
      url: getMenuItemImageUrlForSeed(item.name, item.categoryName),
    }));
    const uniqueCatalog = [
      ...new Map(catalogUrls.map((entry) => [entry.url, entry])).values(),
    ];
    catalogFetchFailed = await checkUrlsBatch(uniqueCatalog);

    const dbUrls = dbRows
      .filter((r) => r.image_url?.trim())
      .map((r) => ({ name: r.name, url: r.image_url!.trim() }));
    const uniqueDb = [...new Map(dbUrls.map((entry) => [entry.url, entry])).values()];
    dbFetchFailed = await checkUrlsBatch(uniqueDb);
  }

  const ok =
    dbMissingImage.length === 0 &&
    dbNonThumbUrls.length === 0 &&
    catalogNonThumb.length === 0 &&
    catalogFetchFailed.length === 0 &&
    dbFetchFailed.length === 0;

  return {
    ok,
    dbTotal: dbRows.length,
    dbWithImage: dbRows.filter((r) => r.image_url?.trim()).length,
    dbMissingImage,
    dbNonThumbUrls,
    catalogNonThumb,
    catalogFetchFailed,
    dbFetchFailed,
  };
}
