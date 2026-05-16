/**
 * Public menu images — database image_url only (no runtime stock-photo fallback).
 * Location: lib/dining/menu-item-images.ts
 */

import type { PublicMenuItem } from '@/lib/dining/menu-display';
import { MENU_IMAGE_THUMB_WIDTH } from '@/lib/data/menu-image-thumb';

/** Next/Image `sizes` hint for book tiles and cards (matches seeded thumb width). */
export const MENU_ITEM_IMAGE_SIZES_TILE = `(max-width: 640px) 45vw, ${MENU_IMAGE_THUMB_WIDTH}px`;

/** Next/Image `sizes` for detail modal / hero dish face. */
export const MENU_ITEM_IMAGE_SIZES_DETAIL = `(max-width: 768px) 100vw, 512px`;

/** Returns cms_menu_items.image_url when set in Neon. */
export function getMenuItemImageFromDb(item: Pick<PublicMenuItem, 'imageUrl'>): string | null {
  const url = item.imageUrl?.trim();
  if (!url) return null;
  return url;
}
