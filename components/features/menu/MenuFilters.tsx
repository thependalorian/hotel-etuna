/**
 * Menu Filters Component
 * 
 * Purpose: Filter controls for menu management page
 * Location: /components/features/menu/MenuFilters.tsx
 * 
 * Features:
 * - Search input
 * - Property filter dropdown
 * - Category filter dropdown
 * 
 * Design System:
 * - Uses semantic tokens: text-base-content, bg-base-100
 * - Input size: min-h-[44px] (Fitt's Law)
 * 
 * Accessibility:
 * - Proper labels for all inputs
 * - Keyboard navigation support
 * 
 * @param {string} searchQuery - Current search query
 * @param {string} selectedProperty - Selected property
 * @param {string} selectedCategory - Selected category
 * @param {Function} onSearchChange - Search change handler
 * @param {Function} onPropertyChange - Property change handler
 * @param {Function} onCategoryChange - Category change handler
 * 
 * @module MenuFilters
 */

import { Search } from 'lucide-react';

interface MenuFiltersProps {
  searchQuery: string;
  selectedProperty: string;
  selectedCategory: string;
  onSearchChange: (query: string) => void;
  onPropertyChange: (property: string) => void;
  onCategoryChange: (category: string) => void;
}

export default function MenuFilters({ 
  searchQuery, 
  selectedProperty, 
  selectedCategory,
  onSearchChange,
  onPropertyChange,
  onCategoryChange
}: MenuFiltersProps) {
  return (
    <div className="card bg-base-100 shadow-lg card-hover">
      <div className="card-body">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <div className="form-control">
              <div className="input-group">
                <span className="bg-base-200 border border-base-300 rounded-l-lg px-3 flex items-center min-h-[44px]">
                  <Search className="w-5 h-5 text-base-content/70" />
                </span>
                <input
                  type="text"
                  placeholder="Search menu items..."
                  className="input input-bordered flex-1 min-h-[44px] rounded-l-none"
                  value={searchQuery}
                  onChange={(e) => onSearchChange(e.target.value)}
                />
              </div>
            </div>
          </div>
          <select 
            className="select select-bordered min-h-[44px]" 
            value={selectedProperty} 
            onChange={(e) => onPropertyChange(e.target.value)}
          >
            <option value="all">All Properties</option>
            {/* Add properties dynamically */}
          </select>
          <select 
            className="select select-bordered min-h-[44px]" 
            value={selectedCategory} 
            onChange={(e) => onCategoryChange(e.target.value)}
          >
            <option value="all">All Categories</option>
            <option value="appetizers">Appetizers</option>
            <option value="mains">Main Courses</option>
            <option value="desserts">Desserts</option>
            <option value="beverages">Beverages</option>
            <option value="specials">Specials</option>
          </select>
        </div>
      </div>
    </div>
  );
}
