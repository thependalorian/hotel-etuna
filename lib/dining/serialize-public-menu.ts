/**
 * Serialize DB menu graph into a client-safe public menu payload.
 * Location: lib/dining/serialize-public-menu.ts
 */

import {
  getCategoryImageSrc,
  getCategoryServiceLabel,
  itemRequiresAdvanceOrder,
  type PublicMenuCategory,
  type PublicMenuItem,
  type PublicMenuPayload,
} from '@/lib/dining/menu-display';

type DbCategory = {
  id: string;
  name: string;
  description: string | null;
  displayOrder: number | null;
};

type DbMenuItem = {
  id: string;
  categoryId: string | null;
  name: string;
  price: unknown;
  currency: string | null;
  description: string | null;
  imageUrl?: string | null;
  dietaryTags?: string[] | null;
  isAvailable?: boolean | null;
};

export type SerializePublicMenuOptions = {
  /** Menu item UUIDs ranked by analytics (restaurant_order_items volume). */
  featuredMenuItemIds?: string[];
};

export function serializePublicMenu(
  categories: DbCategory[],
  itemsByCategory: Map<string, DbMenuItem[]>,
  options: SerializePublicMenuOptions = {},
): PublicMenuPayload {
  const featuredIdSet = new Set(options.featuredMenuItemIds ?? []);
  const featured: PublicMenuItem[] = [];
  let itemCount = 0;

  const publicCategories: PublicMenuCategory[] = categories.map((category) => {
    const rawItems = (itemsByCategory.get(category.id) ?? []).filter(
      (item) => item.isAvailable !== false,
    );

    const items: PublicMenuItem[] = rawItems.map((item) => {
      const price = Number(item.price);
      const isFeatured = featuredIdSet.has(item.id);
      const publicItem: PublicMenuItem = {
        id: item.id,
        name: item.name,
        description: item.description,
        price,
        currency: item.currency ?? 'NAD',
        imageUrl: item.imageUrl ?? null,
        dietaryTags: item.dietaryTags ?? [],
        isFeatured,
        requiresAdvanceOrder: itemRequiresAdvanceOrder(item.description, category.name),
      };
      if (isFeatured) featured.push(publicItem);
      return publicItem;
    });

    itemCount += items.length;

    return {
      id: category.id,
      name: category.name,
      description: category.description,
      serviceLabel: getCategoryServiceLabel(category.name),
      imageSrc: getCategoryImageSrc(category.name),
      items,
    };
  });

  const featuredOrdered = (options.featuredMenuItemIds ?? [])
    .map((id) => featured.find((item) => item.id === id))
    .filter((item): item is PublicMenuItem => item != null);

  return {
    categories: publicCategories.filter((category) => category.items.length > 0),
    featured: featuredOrdered,
    itemCount,
  };
}
