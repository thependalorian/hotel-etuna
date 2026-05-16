/**
 * Mid-size menu thumbnails for DB storage and Next/Image (book tiles, cards).
 * Location: lib/data/menu-image-thumb.ts
 */

/** Width stored in cms_menu_items.image_url — balances quality and payload. */
export const MENU_IMAGE_THUMB_WIDTH = 480;

/** 4:3 crop used across menu food photography. */
export const MENU_IMAGE_THUMB_HEIGHT = 360;

export const MENU_IMAGE_THUMB_QUALITY = 80;

export function buildUnsplashMenuThumbUrl(
  photoId: string,
  width: number = MENU_IMAGE_THUMB_WIDTH,
): string {
  const height = Math.round(width * (MENU_IMAGE_THUMB_HEIGHT / MENU_IMAGE_THUMB_WIDTH));
  return `https://images.unsplash.com/photo-${photoId}?w=${width}&h=${height}&q=${MENU_IMAGE_THUMB_QUALITY}&auto=format&fit=crop`;
}

/**
 * @param commonsPath e.g. `6/66/Mopane-worm-meal.jpg`
 */
/** Direct Commons file (800px or less); Next.js Image downscales to tile size. */
export function buildWikimediaMenuThumbUrl(commonsPath: string): string {
  return `https://upload.wikimedia.org/wikipedia/commons/${commonsPath}`;
}

export function isMenuThumbUrl(url: string): boolean {
  const trimmed = url.trim();
  if (!trimmed) return false;
  if (trimmed.includes('upload.wikimedia.org/wikipedia/commons/')) return true;
  if (trimmed.includes('images.unsplash.com')) {
    const parsed = new URL(trimmed);
    const w = parsed.searchParams.get('w');
    return w !== null && Number(w) <= MENU_IMAGE_THUMB_WIDTH + 80;
  }
  return false;
}
