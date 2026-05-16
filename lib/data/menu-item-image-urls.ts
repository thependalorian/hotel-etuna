/**
 * Per-dish image URLs for seeding cms_menu_items.image_url (live DB only at runtime).
 * Location: lib/data/menu-item-image-urls.ts
 */

import { ETUNA_MENU_ITEMS } from '@/lib/data/etuna-restaurant-menu-catalog';
import { getImageUrlForMenuItem } from '@/lib/data/menu-item-image-kinds';

export { getImageUrlForMenuItem, resolveMenuImageKind } from '@/lib/data/menu-item-image-kinds';
export {
  MENU_IMAGE_THUMB_WIDTH,
  MENU_IMAGE_THUMB_HEIGHT,
  isMenuThumbUrl,
} from '@/lib/data/menu-image-thumb';

/** Full map: every catalog line → vetted image URL by visual intent. */
export const MENU_ITEM_IMAGE_URLS: Record<string, string> = Object.fromEntries(
  ETUNA_MENU_ITEMS.map((item) => [item.name, getImageUrlForMenuItem(item)]),
);

export function getMenuItemImageUrlForSeed(name: string, categoryName: string): string {
  const item = ETUNA_MENU_ITEMS.find((i) => i.name === name && i.categoryName === categoryName);
  if (item) return getImageUrlForMenuItem(item);
  const byName = ETUNA_MENU_ITEMS.find((i) => i.name === name);
  if (byName) return getImageUrlForMenuItem(byName);
  return getImageUrlForMenuItem({
    categoryName,
    name,
    description: '',
    price: '0',
  });
}
