import { describe, expect, it } from 'vitest';
import {
  MENU_IMAGE_THUMB_WIDTH,
  buildUnsplashMenuThumbUrl,
  buildWikimediaMenuThumbUrl,
  isMenuThumbUrl,
} from '@/lib/data/menu-image-thumb';
import { MENU_ITEM_IMAGE_URLS } from '@/lib/data/menu-item-image-urls';

describe('menu-image-thumb', () => {
  it('builds Unsplash thumb URLs at mid width', () => {
    const url = buildUnsplashMenuThumbUrl('1525351485928-ff40f46d65c1');
    expect(url).toContain(`w=${MENU_IMAGE_THUMB_WIDTH}`);
    expect(url).toContain('fit=crop');
    expect(isMenuThumbUrl(url)).toBe(true);
  });

  it('builds Wikimedia commons URLs', () => {
    const url = buildWikimediaMenuThumbUrl('6/66/Mopane-worm-meal.jpg');
    expect(url).toContain('upload.wikimedia.org/wikipedia/commons/6/66/');
    expect(isMenuThumbUrl(url)).toBe(true);
  });

  it('catalog map uses thumb URLs for every line', () => {
    const urls = Object.values(MENU_ITEM_IMAGE_URLS);
    expect(urls.length).toBeGreaterThan(100);
    for (const url of urls) {
      expect(isMenuThumbUrl(url)).toBe(true);
    }
  });

  it('rejects oversized Unsplash URLs', () => {
    expect(
      isMenuThumbUrl(
        'https://images.unsplash.com/photo-1525351485928-ff40f46d65c1?w=900&q=85',
      ),
    ).toBe(false);
  });
});
