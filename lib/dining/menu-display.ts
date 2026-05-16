/**
 * Public menu display helpers — category visuals, pricing, featured items.
 * Location: lib/dining/menu-display.ts
 */

import { publicCopy } from '@/lib/copy/public';

export type PublicMenuItem = {
  id: string;
  name: string;
  description: string | null;
  price: number;
  currency: string;
  imageUrl: string | null;
  dietaryTags: string[];
  isFeatured: boolean;
  requiresAdvanceOrder: boolean;
};

export type PublicMenuCategory = {
  id: string;
  name: string;
  description: string | null;
  serviceLabel: string;
  imageSrc: string;
  items: PublicMenuItem[];
};

export type PublicMenuPayload = {
  categories: PublicMenuCategory[];
  featured: PublicMenuItem[];
  itemCount: number;
};

const CATEGORY_IMAGES: Record<string, string> = {
  'light meal': '/images/hospitality/guest_house.jpeg',
  'main course': '/images/hospitality/restaurant_dining.jpeg',
  'traditional cuisine': '/images/hospitality/restaurant_dining.jpeg',
  pizza: '/images/hospitality/restaurant_dining.jpeg',
  platters: '/images/hospitality/restaurant_dining.jpeg',
  desserts: '/images/hospitality/guest_house.jpeg',
  'hot beverages': '/images/hospitality/guest_house.jpeg',
  'soft drinks': '/images/hospitality/restaurant_bar.jpeg',
  cocktails: '/images/hospitality/restaurant_bar.jpeg',
  'beer & cider': '/images/hospitality/restaurant_bar.jpeg',
  'spirits & liqueur': '/images/hospitality/restaurant_bar.jpeg',
  wine: '/images/hospitality/restaurant_bar.jpeg',
};

const DEFAULT_CATEGORY_IMAGE = '/images/hospitality/restaurant_dining.jpeg';

export function getCategoryImageSrc(categoryName: string): string {
  return CATEGORY_IMAGES[categoryName.toLowerCase()] ?? DEFAULT_CATEGORY_IMAGE;
}

export function getCategoryServiceLabel(categoryName: string): string {
  const key = categoryName.toLowerCase();
  if (key.includes('light meal') || key.includes('hot beverage')) {
    return publicCopy.dining.hours.breakfast;
  }
  if (key.includes('main') || key.includes('traditional') || key.includes('pizza') || key.includes('platter')) {
    return publicCopy.dining.hours.lunchDinner;
  }
  if (
    key.includes('soft drink') ||
    key.includes('cocktail') ||
    key.includes('beer') ||
    key.includes('spirit') ||
    key.includes('wine') ||
    key.includes('dessert')
  ) {
    return `Bar · ${publicCopy.dining.hours.bar}`;
  }
  return publicCopy.dining.hours.lunchDinner;
}

export function formatMenuPrice(price: number, currency = 'NAD'): string {
  if (!Number.isFinite(price)) return 'Price on request';
  const symbol = currency === 'NAD' ? 'N$' : currency;
  const formatted = price.toLocaleString('en-NA', {
    minimumFractionDigits: price % 1 === 0 ? 0 : 2,
    maximumFractionDigits: 2,
  });
  return `${symbol}${formatted}`;
}

export function itemRequiresAdvanceOrder(description: string | null, categoryName: string): boolean {
  const text = `${description ?? ''} ${categoryName}`.toLowerCase();
  return text.includes('advance') || categoryName.toLowerCase().includes('platter');
}
