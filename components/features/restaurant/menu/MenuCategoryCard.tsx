/**
 * Menu Category Card Component
 * 
 * Purpose: Display menu category with its items
 * Location: /components/features/restaurant/menu/MenuCategoryCard.tsx
 * 
 * Features:
 * - Category name and description
 * - Grid of menu items
 * - Staggered animations
 * 
 * Design System:
 * - Uses semantic tokens: text-base-content, bg-base-100
 * - Card shadows: shadow-lg with hover:shadow-xl
 * 
 * Accessibility:
 * - Semantic HTML structure
 * - Proper heading hierarchy (h4)
 * 
 * @param {Object} category - Menu category object
 * @param {number} catIndex - Category index for animation delay
 * @param {Object} menuItemImages - Map of menu item IDs to image URLs
 * 
 * @module MenuCategoryCard
 */

import MenuItemCard from './MenuItemCard';

interface MenuItem {
  id: string;
  name: string;
  description: string;
  price: number;
  image_url?: string;
  dietary_info?: string[];
  allergens?: string[];
  is_available: boolean;
}

interface MenuCategory {
  id: string;
  name: string;
  description?: string;
  items: MenuItem[];
}

interface MenuCategoryCardProps {
  category: MenuCategory;
  catIndex: number;
  menuItemImages: Record<string, string>;
}

export default function MenuCategoryCard({ category, catIndex, menuItemImages }: MenuCategoryCardProps) {
  return (
    <div 
      className="card bg-base-100 shadow-lg card-hover animate-slide-up"
      style={{ animationDelay: `${catIndex * 100}ms` }}
    >
      <div className="card-body">
        <h4 className="card-title text-xl font-display mb-2">{category.name}</h4>
        {category.description && (
          <p className="text-base-content/70 mb-4">{category.description}</p>
        )}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
          {category.items.map((item, itemIndex) => (
            <MenuItemCard
              key={item.id}
              item={item}
              itemIndex={itemIndex}
              menuItemImages={menuItemImages}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
