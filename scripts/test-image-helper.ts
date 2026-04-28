/**
 * Test Image Helper
 * 
 * Purpose: Provides real, working image URLs for API tests
 * Location: /scripts/test-image-helper.ts
 * 
 * Uses free image services that provide actual images:
 * - Unsplash Source API (https://source.unsplash.com/)
 * - Picsum Photos (https://picsum.photos/)
 * - Placeholder.com (fallback)
 * 
 * All images are publicly accessible and suitable for testing.
 */

/**
 * Get a random image URL from Unsplash
 * @param width - Image width in pixels (default: 800)
 * @param height - Image height in pixels (default: 600)
 * @param category - Optional category (hotel, restaurant, food, room, etc.)
 */
export function getUnsplashImage(
  width: number = 800,
  height: number = 600,
  category?: string
): string {
  const baseUrl = 'https://source.unsplash.com';
  if (category) {
    return `${baseUrl}/${width}x${height}/?${category}`;
  }
  return `${baseUrl}/${width}x${height}/?random`;
}

/**
 * Get a random image URL from Picsum Photos
 * @param width - Image width in pixels (default: 800)
 * @param height - Image height in pixels (default: 600)
 * @param seed - Optional seed for consistent images
 */
export function getPicsumImage(
  width: number = 800,
  height: number = 600,
  seed?: number
): string {
  const baseUrl = 'https://picsum.photos';
  if (seed) {
    return `${baseUrl}/seed/${seed}/${width}/${height}`;
  }
  return `${baseUrl}/${width}/${height}`;
}

/**
 * Get a placeholder image URL (fallback)
 * @param width - Image width in pixels (default: 800)
 * @param height - Image height in pixels (default: 600)
 * @param text - Optional text to display on placeholder
 */
export function getPlaceholderImage(
  width: number = 800,
  height: number = 600,
  text?: string
): string {
  const baseUrl = 'https://placehold.co';
  if (text) {
    return `${baseUrl}/${width}x${height}?text=${encodeURIComponent(text)}`;
  }
  return `${baseUrl}/${width}x${height}`;
}

/**
 * Get a property image URL (hotel/lodge/restaurant exterior)
 */
export function getPropertyImage(): string {
  // Use Unsplash with hotel/restaurant category
  const categories = ['hotel', 'resort', 'restaurant', 'lodge'];
  const category = categories[Math.floor(Math.random() * categories.length)];
  return getUnsplashImage(1200, 800, category);
}

/**
 * Get a room image URL (bedroom/interior)
 */
export function getRoomImage(): string {
  // Use Unsplash with room/interior category
  const categories = ['bedroom', 'hotel-room', 'interior'];
  const category = categories[Math.floor(Math.random() * categories.length)];
  return getUnsplashImage(1000, 700, category);
}

/**
 * Get a menu item image URL (food/dish)
 */
export function getMenuItemImage(): string {
  // Use Unsplash with food category
  return getUnsplashImage(800, 600, 'food');
}

/**
 * Get a CMS media image URL (generic content image)
 */
export function getCmsMediaImage(): string {
  // Use Picsum for reliable, fast-loading images
  return getPicsumImage(1024, 768);
}

/**
 * Get multiple property images (for images array)
 * @param count - Number of images to return (default: 3)
 */
export function getPropertyImages(count: number = 3): string[] {
  return Array.from({ length: count }, () => getPropertyImage());
}

/**
 * Get multiple room images (for images array)
 * @param count - Number of images to return (default: 2)
 */
export function getRoomImages(count: number = 2): string[] {
  return Array.from({ length: count }, () => getRoomImage());
}

/**
 * Get a consistent image URL (same image every time) - useful for testing
 * @param type - Type of image (property, room, menu, cms)
 */
export function getConsistentImage(type: 'property' | 'room' | 'menu' | 'cms' = 'property'): string {
  const seeds: Record<string, number> = {
    property: 1001,
    room: 1002,
    menu: 1003,
    cms: 1004,
  };
  
  const sizes: Record<string, { width: number; height: number }> = {
    property: { width: 1200, height: 800 },
    room: { width: 1000, height: 700 },
    menu: { width: 800, height: 600 },
    cms: { width: 1024, height: 768 },
  };
  
  const seed = seeds[type];
  const { width, height } = sizes[type];
  
  return getPicsumImage(width, height, seed);
}

/**
 * Get a random image URL (for variety in tests)
 * @param type - Type of image (property, room, menu, cms)
 */
export function getRandomImage(type: 'property' | 'room' | 'menu' | 'cms' = 'property'): string {
  switch (type) {
    case 'property':
      return getPropertyImage();
    case 'room':
      return getRoomImage();
    case 'menu':
      return getMenuItemImage();
    case 'cms':
      return getCmsMediaImage();
    default:
      return getPicsumImage();
  }
}

// Export default helper functions
export default {
  getPropertyImage,
  getRoomImage,
  getMenuItemImage,
  getCmsMediaImage,
  getPropertyImages,
  getRoomImages,
  getConsistentImage,
  getRandomImage,
  getUnsplashImage,
  getPicsumImage,
  getPlaceholderImage,
};
