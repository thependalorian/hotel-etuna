/**
 * Menu Display - Client-side menu viewer
 * Location: components/dining/MenuDisplay.tsx
 * Purpose: Renders the full menu with categories and items
 */

'use client';

import { useState } from 'react';
import type { PublicMenuPayload, PublicMenuItem } from '@/lib/dining/menu-display';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';

type MenuDisplayProps = {
  menu: PublicMenuPayload & {
    featuredMenuItemIds: string[];
    restaurantName: string;
  };
};

export function MenuDisplay({ menu }: MenuDisplayProps) {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const displayCategories = selectedCategory
    ? menu.categories.filter((c) => c.id === selectedCategory)
    : menu.categories;

  return (
    <div className="space-y-8">
      {/* Category filter */}
      {menu.categories.length > 1 && (
        <div className="flex flex-wrap gap-2 justify-center">
          <button
            onClick={() => setSelectedCategory(null)}
            className={`btn btn-sm rounded-full ${
              selectedCategory === null ? 'btn-primary' : 'btn-outline'
            }`}
          >
            All
          </button>
          {menu.categories.map((category) => (
            <button
              key={category.id}
              onClick={() => setSelectedCategory(category.id)}
              className={`btn btn-sm rounded-full ${
                selectedCategory === category.id ? 'btn-primary' : 'btn-outline'
              }`}
            >
              {category.name}
            </button>
          ))}
        </div>
      )}

      {/* Menu items */}
      <div className="space-y-12">
        {displayCategories.map((category) => (
          <div key={category.id}>
            <h3 className="text-2xl font-bold text-terracotta-900 mb-6">{category.name}</h3>
            {category.description && (
              <p className="text-terracotta-700 mb-6">{category.description}</p>
            )}
            <div className="grid gap-6 md:grid-cols-2">
              {category.items.map((item) => (
                <Card key={item.id} className="p-6 hover:shadow-lg transition-shadow">
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-semibold text-lg text-terracotta-900">{item.name}</h4>
                        {menu.featuredMenuItemIds.includes(item.id) && (
                          <Badge variant="primary" size="sm">
                            Popular
                          </Badge>
                        )}
                      </div>
                      {item.description && (
                        <p className="text-sm text-terracotta-700 mb-2">{item.description}</p>
                      )}
                    </div>
                    <div className="ml-4 text-right">
                      <div className="font-bold text-lg text-terracotta-900">
                        N${item.price.toFixed(2)}
                      </div>
                    </div>
                  </div>
                  {(item.dietaryTags ?? []).map((tag) => (
                    <Badge key={tag} variant="success" size="sm" className="mr-1 capitalize">
                      {tag}
                    </Badge>
                  ))}
                </Card>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
