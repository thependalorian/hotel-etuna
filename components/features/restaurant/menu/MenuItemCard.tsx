/**
 * Restaurant Menu Item Card Component
 * 
 * Purpose: Display individual menu item in category
 * Location: /components/features/restaurant/menu/MenuItemCard.tsx
 * 
 * Features:
 * - Item image or placeholder
 * - Item name and description
 * - Dietary information badges
 * - Edit and delete buttons
 * 
 * Design System:
 * - Uses semantic tokens: text-base-content, bg-base-200
 * - Card shadows: shadow-md with hover:shadow-lg
 * - Button sizes: min-h-[44px]
 * 
 * Accessibility:
 * - Semantic HTML structure
 * - Proper heading hierarchy (h5)
 * - Alt text for images
 * - ARIA labels for buttons
 * 
 * @param {Object} item - Menu item data object
 * @param {number} itemIndex - Item index for animation delay
 * @param {Object} menuItemImages - Map of menu item IDs to image URLs
 * 
 * @module MenuItemCard
 */

import Image from 'next/image';
import Link from 'next/link';

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

interface MenuItemCardProps {
  item: MenuItem;
  itemIndex: number;
  menuItemImages: Record<string, string>;
}

export default function MenuItemCard({ item, itemIndex, menuItemImages }: MenuItemCardProps) {
  return (
    <div 
      className="card card-compact bg-base-200 shadow-md hover:shadow-lg transition-shadow duration-200 animate-fade-in"
      style={{ animationDelay: `${itemIndex * 50}ms` }}
    >
      <figure>
        {(item.image_url || menuItemImages[item.id]) ? (
          <Image 
            src={menuItemImages[item.id] || item.image_url || ''} 
            alt={item.name} 
            width={400} 
            height={128} 
            className="w-full h-32 object-cover" 
          />
        ) : (
          <div className="w-full h-32 bg-base-300 flex items-center justify-center">
            <svg className="w-12 h-12 text-base-content/30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
        )}
      </figure>
      <div className="card-body">
        <h5 className="card-title text-base">{item.name}</h5>
        <p className="text-sm text-base-content/70 line-clamp-2">{item.description}</p>
        {item.dietary_info && item.dietary_info.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-2">
            {item.dietary_info.slice(0, 3).map((diet, idx) => (
              <span key={idx} className="badge badge-xs badge-outline">
                {diet}
              </span>
            ))}
          </div>
        )}
        <div className="card-actions justify-end mt-2">
          <Link
            href={`/menu/${item.id}/edit`}
            className="btn btn-sm btn-ghost gentle-lift min-h-[44px]"
            aria-label={`Edit ${item.name}`}
          >
            Edit
          </Link>
          <button 
            className="btn btn-sm btn-error gentle-lift min-h-[44px]" 
            aria-label={`Delete ${item.name}`}
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}
