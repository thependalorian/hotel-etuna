/**
 * Menu Display - Client-side menu viewer
 * Location: components/dining/MenuDisplay.tsx
 * Purpose: Renders the full menu with categories and items
 */

'use client';

import { useState } from 'react';
import Image from 'next/image';
import type { PublicMenuPayload } from '@/lib/dining/menu-display';
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
            <h3 className="text-2xl font-bold text-ci-secondary-chocolate mb-6">{category.name}</h3>
            {category.description && (
              <p className="text-ink-700 mb-6">{category.description}</p>
            )}
            <div className="grid gap-6 md:grid-cols-2">
              {category.items.map((item) => (
                <Card key={item.id} variant="listing" className="overflow-hidden border border-nude-200">
                  <div className="etuna-card-media aspect-video">
                    <Image
                      src={item.imageUrl || category.imageSrc}
                      alt={item.name}
                      fill
                      sizes="(max-width: 768px) 100vw, 50vw"
                      className="object-cover"
                    />
                  </div>
                  <div className="p-5">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h4 className="font-semibold text-lg text-ci-secondary-chocolate">{item.name}</h4>
                          {menu.featuredMenuItemIds.includes(item.id) && (
                            <Badge variant="primary" size="sm">
                              Popular
                            </Badge>
                          )}
                        </div>
                        {item.description && (
                          <p className="mt-1 text-sm text-ink-600">{item.description}</p>
                        )}
                      </div>
                      <div className="text-right font-bold text-lg text-ci-secondary-chocolate">
                        N${item.price.toFixed(2)}
                      </div>
                    </div>
                    {(item.dietaryTags ?? []).length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-1">
                        {(item.dietaryTags ?? []).map((tag) => (
                          <Badge key={tag} variant="success" size="sm" className="capitalize">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                </Card>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
