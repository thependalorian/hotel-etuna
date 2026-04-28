/**
 * MenuItem Component
 * 
 * Purpose: Display a single menu item card with details
 * Location: /components/features/restaurant/MenuItem.tsx
 * 
 * Features:
 * - Menu item information display
 * - CMS image support
 * - Price and availability indicators
 * - Dietary information
 * - Responsive design
 */

'use client';

import React from 'react';
import { Card, CardContent } from '@/components/ui/Card';
import { ImagePlaceholder } from '@/components/ui';
import { Image as ImageIcon, DollarSign, Tag } from 'lucide-react';
import { cn } from '@/lib/utils/cn';

interface MenuItemProps {
  id: string;
  name: string;
  description?: string;
  price: number;
  category?: string;
  imageUrl?: string;
  isAvailable?: boolean;
  dietary?: string[];
  onSelect?: (id: string) => void;
  className?: string;
}

export default function MenuItem({
  id,
  name,
  description,
  price,
  category,
  imageUrl,
  isAvailable = true,
  dietary = [],
  onSelect,
  className = '',
}: MenuItemProps) {
  return (
    <Card
      className={cn(
        'overflow-hidden card-hover cursor-pointer',
        !isAvailable && 'opacity-60',
        className
      )}
      onClick={() => onSelect?.(id)}
    >
      <figure className="relative h-40 w-full overflow-hidden bg-base-200">
        <ImagePlaceholder
          src={imageUrl}
          alt={name}
          fill
          className="object-cover"
        />
      </figure>
      <CardContent className="p-4">
        <div className="flex justify-between items-start mb-2">
          <div className="flex-1">
            <h3 className="font-bold text-lg font-display">{name}</h3>
            {category && (
              <div className="flex items-center gap-1 mt-1">
                <Tag className="w-3 h-3 text-base-content/60" />
                <span className="text-xs text-base-content/60">{category}</span>
              </div>
            )}
          </div>
          <div className="flex items-center gap-1 text-primary font-bold text-lg">
            <DollarSign className="w-4 h-4" />
            <span>{price.toFixed(2)}</span>
          </div>
        </div>

        {description && (
          <p className="text-sm text-base-content/70 mt-2 line-clamp-2">
            {description}
          </p>
        )}

        {dietary.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-3">
            {dietary.map((tag) => (
              <span
                key={tag}
                className="badge badge-sm badge-outline text-xs"
              >
                {tag}
              </span>
            ))}
          </div>
        )}

        {!isAvailable && (
          <div className="mt-3">
            <span className="badge badge-warning badge-sm">Unavailable</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
