/**
 * Menu book pagination — layout and items-per-page for public menu spreads.
 * Location: lib/dining/menu-book-pagination.ts
 */

import type { PublicMenuCategory, PublicMenuItem } from '@/lib/dining/menu-display';

export type MenuBookLayout = 'grid' | 'list';

/** A single two-sided page in the menu book (front face + back face). */
export type MenuBookPage = {
  id: string;
  front: import('react').ReactNode;
  back: import('react').ReactNode;
};

/** Food pages: 2 columns × 3 rows per screen (single-page menu). */
export const FOOD_GRID_COLUMNS = 2;
export const FOOD_GRID_ROWS = 3;
export const FOOD_GRID_ITEMS_PER_FACE = FOOD_GRID_COLUMNS * FOOD_GRID_ROWS;

/** Drink / bar pages use a compact list (no thumbnails). */
export const DRINK_LIST_ITEMS_PER_FACE = 8;

export function isDrinkCategory(categoryName: string): boolean {
  const key = categoryName.toLowerCase();
  return (
    key.includes('beverage') ||
    key.includes('soft drink') ||
    key.includes('cocktail') ||
    key.includes('beer') ||
    key.includes('cider') ||
    key.includes('spirit') ||
    key.includes('liqueur') ||
    key.includes('wine') ||
    key.includes('hot beverage')
  );
}

export function getMenuBookLayout(categoryName: string): MenuBookLayout {
  return isDrinkCategory(categoryName) ? 'list' : 'grid';
}

/** Food categories show photo tiles; drinks are name + price only. */
export const categoryUsesMenuThumbnails = (categoryName: string) => !isDrinkCategory(categoryName);

export type MenuBookFaceChunk = {
  items: PublicMenuItem[];
  category: PublicMenuCategory;
  layout: MenuBookLayout;
};

export function getItemsPerBookFace(categoryName: string): number {
  return getMenuBookLayout(categoryName) === 'list'
    ? DRINK_LIST_ITEMS_PER_FACE
    : FOOD_GRID_ITEMS_PER_FACE;
}

export function chunkMenuItems<T>(items: T[], size: number): T[][] {
  if (size <= 0) return [];
  const chunks: T[][] = [];
  for (let i = 0; i < items.length; i += size) {
    chunks.push(items.slice(i, i + size));
  }
  return chunks;
}

export function buildMenuBookChunkPlan(
  items: PublicMenuItem[],
  categoryName: string,
): { chunks: PublicMenuItem[][]; perFace: number; layout: MenuBookLayout } {
  const perFace = getItemsPerBookFace(categoryName);
  const layout = getMenuBookLayout(categoryName);
  const chunks = chunkMenuItems(items, perFace);
  return { chunks, perFace, layout };
}

/** Pairs consecutive page faces onto one physical spread (left/right). */
export function pairBookSides<T>(faces: T[]): { front: T | null; back: T | null }[] {
  const sheets: { front: T | null; back: T | null }[] = [];
  for (let i = 0; i < faces.length; i += 2) {
    sheets.push({ front: faces[i] ?? null, back: faces[i + 1] ?? null });
  }
  return sheets;
}

/** Flatten categories into ordered page faces for the full-menu book. */
export function collectFullMenuFaceChunks(categories: PublicMenuCategory[]): MenuBookFaceChunk[] {
  const faces: MenuBookFaceChunk[] = [];
  for (const category of categories) {
    const { chunks, layout } = buildMenuBookChunkPlan(category.items, category.name);
    for (const items of chunks) {
      faces.push({ items, category, layout });
    }
  }
  return faces;
}
