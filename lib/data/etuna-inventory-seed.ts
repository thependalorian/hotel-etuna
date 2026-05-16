/**
 * Default inventory seed data derived from menu catalog SKUs.
 * Location: lib/data/etuna-inventory-seed.ts
 */

import { ETUNA_MENU_ITEMS } from '@/lib/data/etuna-restaurant-menu-catalog';

export type InventorySeedRow = {
  sku: string;
  name: string;
  category: string;
  reorderPoint: number;
  initialOnHand: number;
};

function defaultReorderPoint(categoryName: string): number {
  if (categoryName === 'Wine') return 6;
  if (categoryName === 'Spirits & Liqueur') return 4;
  return 12;
}

function defaultOnHand(categoryName: string): number {
  if (categoryName === 'Wine') return 24;
  return 48;
}

export function buildInventorySeedFromCatalog(): InventorySeedRow[] {
  return ETUNA_MENU_ITEMS.filter((item) => item.inventorySku).map((item) => ({
    sku: item.inventorySku!,
    name: item.name,
    category: item.categoryName,
    reorderPoint: defaultReorderPoint(item.categoryName),
    initialOnHand: defaultOnHand(item.categoryName),
  }));
}
