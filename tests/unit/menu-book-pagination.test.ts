import { describe, expect, it } from 'vitest';
import {
  FOOD_GRID_ITEMS_PER_FACE,
  DRINK_LIST_ITEMS_PER_FACE,
  buildMenuBookChunkPlan,
  categoryUsesMenuThumbnails,
  collectFullMenuFaceChunks,
  getMenuBookLayout,
  getItemsPerBookFace,
  pairBookSides,
} from '@/lib/dining/menu-book-pagination';
import type { PublicMenuCategory } from '@/lib/dining/menu-display';
import type { PublicMenuItem } from '@/lib/dining/menu-display';

const item = (id: string): PublicMenuItem => ({
  id,
  name: `Item ${id}`,
  description: null,
  price: 100,
  currency: 'NAD',
  imageUrl: null,
  dietaryTags: [],
  isFeatured: false,
  requiresAdvanceOrder: false,
});

describe('menu-book-pagination', () => {
  it('uses 2×2 grid (4 items) for food categories', () => {
    expect(getMenuBookLayout('Main Course')).toBe('grid');
    expect(getItemsPerBookFace('Pizza')).toBe(FOOD_GRID_ITEMS_PER_FACE);
    expect(FOOD_GRID_ITEMS_PER_FACE).toBe(4);

    const { chunks } = buildMenuBookChunkPlan(
      [item('1'), item('2'), item('3'), item('4'), item('5')],
      'Main Course',
    );
    expect(chunks[0]).toHaveLength(4);
    expect(chunks[1]).toHaveLength(1);
  });

  it('uses list layout without thumbnails for drinks', () => {
    expect(getMenuBookLayout('Wine')).toBe('list');
    expect(getItemsPerBookFace('Cocktails')).toBe(DRINK_LIST_ITEMS_PER_FACE);
    expect(categoryUsesMenuThumbnails('Beer & Cider')).toBe(false);
    expect(categoryUsesMenuThumbnails('Desserts')).toBe(true);
  });

  it('collectFullMenuFaceChunks and pairBookSides order categories', () => {
    const categories: PublicMenuCategory[] = [
      {
        id: 'c1',
        name: 'Main Course',
        description: null,
        serviceLabel: 'All day',
        imageSrc: '/x.jpg',
        items: [item('1'), item('2'), item('3'), item('4'), item('5')],
      },
      {
        id: 'c2',
        name: 'Wine',
        description: null,
        serviceLabel: 'Bar',
        imageSrc: '/x.jpg',
        items: [item('w1'), item('w2')],
      },
    ];
    const faces = collectFullMenuFaceChunks(categories);
    expect(faces).toHaveLength(3);
    expect(faces[0].layout).toBe('grid');
    expect(faces[2].layout).toBe('list');
    expect(pairBookSides(faces)).toHaveLength(2);
  });
});
