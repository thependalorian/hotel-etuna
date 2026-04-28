/**
 * Menu Item Card Component
 * 
 * Purpose: Display individual menu item in card format
 * Location: /components/features/menu/MenuItemCard.tsx
 * 
 * Features:
 * - Item name and description
 * - Price and category
 * - Availability badge
 * - Dietary and allergen information
 * - Action buttons (Toggle availability, Edit, Delete)
 * 
 * Design System:
 * - Uses semantic tokens: text-base-content, bg-base-100
 * - Card shadows: shadow-lg with hover:shadow-xl
 * - Button sizes: min-h-[44px] for buttons
 * 
 * Accessibility:
 * - Semantic HTML structure
 * - Proper heading hierarchy (h2)
 * - ARIA labels for buttons
 * 
 * @param {Object} item - Menu item data object
 * @param {number} index - Index for animation delay
 * @param {Function} onToggleAvailability - Toggle availability handler
 * @param {Function} onDelete - Delete handler
 * 
 * @module MenuItemCard
 */

import Link from 'next/link';
import { Edit, Trash2 } from 'lucide-react';

interface MenuItem {
  id: string;
  name: string;
  description?: string;
  price: number;
  category: string;
  isAvailable: boolean;
  dietary?: string;
  allergens: string[];
  createdAt: string;
  updatedAt: string;
}

interface MenuItemCardProps {
  item: MenuItem;
  index: number;
  onToggleAvailability: (itemId: string, currentStatus: boolean) => void;
  onDelete: (itemId: string) => void;
}

export default function MenuItemCard({ item, index, onToggleAvailability, onDelete }: MenuItemCardProps) {
  return (
    <div 
      className="rounded-lg border border-nude-200 bg-surface-elevated shadow-nude-soft hover:shadow-nude-medium hover:-translate-y-0.5 transition-all duration-200 animate-slide-up overflow-hidden"
      style={{ animationDelay: `${index * 50}ms` }}
    >
      {/* Image placeholder with aspect ratio 4:3 */}
      <div className="relative w-full pb-[75%] bg-nude-100">
        <div className="absolute inset-0 flex items-center justify-center text-nude-400">
          <svg className="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        </div>
        {/* Availability Badge */}
        <div className="absolute top-3 right-3">
          {item.isAvailable ? (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-semantic-success-light text-semantic-success-dark border border-semantic-success/20">
              <span className="w-2 h-2 rounded-full bg-semantic-success" />
              Available
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-semantic-error-light text-semantic-error-dark border border-semantic-error/20">
              <span className="w-2 h-2 rounded-full bg-semantic-error" />
              Unavailable
            </span>
          )}
        </div>
      </div>
      
      <div className="p-5">
        {/* Item Header */}
        <div className="mb-4">
          <h2 className="font-display text-base font-semibold text-nude-900 mb-2">
            {item.name}
          </h2>
          {item.description && (
            <p className="text-sm text-nude-600 line-clamp-2 leading-relaxed">
              {item.description}
            </p>
          )}
        </div>

        {/* Price and Category */}
        <div className="flex items-center justify-between p-3 bg-nude-50 rounded-lg border border-nude-200 mb-4">
          <span className="font-display text-lg font-bold text-nude-900">
            N${item.price.toFixed(2)}
          </span>
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-nude-600 text-white">
            {item.category}
          </span>
        </div>

        {/* Tags Section */}
        <div className="space-y-3 mb-4">
          {item.dietary && (
            <div>
              <p className="text-xs font-semibold text-nude-700 mb-1.5">Dietary:</p>
              <div className="flex flex-wrap gap-1.5">
                {item.dietary.split(',').map((diet, idx) => (
                  <span key={idx} className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-nude-200 text-nude-800 border border-nude-300">
                    {diet.trim()}
                  </span>
                ))}
              </div>
            </div>
          )}

          {item.allergens.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-nude-700 mb-1.5">Allergens:</p>
              <div className="flex flex-wrap gap-1.5">
                {item.allergens.map((allergen, idx) => (
                  <span key={idx} className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-semantic-error-light text-semantic-error-dark border border-semantic-error/30">
                    {allergen}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-between pt-4 border-t border-nude-200 gap-2">
          <div className="flex items-center gap-2">
            <button
              className="inline-flex items-center px-3 py-2 text-sm font-medium text-nude-700 hover:bg-nude-50 rounded-lg border border-nude-300 transition-colors duration-200 min-h-[44px]"
              onClick={() => onToggleAvailability(item.id, item.isAvailable)}
              aria-label={`${item.isAvailable ? 'Hide' : 'Show'} ${item.name}`}
            >
              {item.isAvailable ? 'Hide' : 'Show'}
            </button>
            <Link
              href={`/menu/new?edit=${encodeURIComponent(item.id)}`}
              className="inline-flex items-center justify-center w-10 h-10 text-nude-700 hover:bg-nude-50 rounded-lg border border-nude-300 transition-colors duration-200 min-h-[44px]"
              aria-label={`Edit ${item.name}`}
            >
              <Edit className="w-4 h-4" />
            </Link>
          </div>
          <button
            className="inline-flex items-center justify-center w-10 h-10 text-semantic-error hover:bg-semantic-error-light rounded-lg border border-semantic-error/30 transition-colors duration-200 min-h-[44px]"
            onClick={() => onDelete(item.id)}
            aria-label={`Delete ${item.name}`}
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
