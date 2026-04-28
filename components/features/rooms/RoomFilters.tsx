/**
 * Room Filters Component
 * 
 * Purpose: Filter controls for room management page
 * Location: /components/features/rooms/RoomFilters.tsx
 * 
 * Features:
 * - Search input
 * - Type filter dropdown
 * - Capacity filter
 * - Clear filters button
 * 
 * Design System:
 * - Uses semantic tokens: text-base-content, bg-base-100
 * - Input size: min-h-[44px] (Fitt's Law)
 * 
 * Accessibility:
 * - Proper labels for all inputs
 * - Keyboard navigation support
 * 
 * @param {Object} filters - Current filter values
 * @param {Function} onFilterChange - Filter change handler
 * @param {Function} onClearFilters - Clear filters handler
 * 
 * @module RoomFilters
 */

import { Search } from 'lucide-react';

interface RoomFiltersProps {
  filters: {
    propertyId: string;
    type: string;
    search: string;
    minPrice: string;
    maxPrice: string;
    capacity: string;
  };
  onFilterChange: (filters: RoomFiltersProps['filters']) => void;
  onClearFilters: () => void;
}

export default function RoomFilters({ filters, onFilterChange, onClearFilters }: RoomFiltersProps) {
  const handleChange = (field: string, value: string) => {
    onFilterChange({ ...filters, [field]: value });
  };

  return (
    <div className="card bg-base-100 shadow-lg card-hover">
      <div className="card-body">
        <div className="flex flex-wrap gap-4 items-end">
          <div className="form-control flex-1 min-w-[200px]">
            <label className="label">
              <span className="label-text font-medium">Search</span>
            </label>
            <div className="input-group">
              <span className="bg-base-200 border border-base-300 rounded-l-lg px-3 flex items-center min-h-[44px]">
                <Search className="w-5 h-5 text-base-content/70" />
              </span>
              <input
                type="text"
                placeholder="Search rooms..."
                className="input input-bordered flex-1 min-h-[44px] rounded-l-none"
                value={filters.search}
                onChange={(e) => handleChange('search', e.target.value)}
              />
            </div>
          </div>

          <div className="form-control">
            <label className="label">
              <span className="label-text font-medium">Type</span>
            </label>
            <select
              className="select select-bordered min-h-[44px]"
              value={filters.type}
              onChange={(e) => handleChange('type', e.target.value)}
            >
              <option value="">All Types</option>
              <option value="Standard">Standard</option>
              <option value="Deluxe">Deluxe</option>
              <option value="Suite">Suite</option>
              <option value="Family">Family</option>
            </select>
          </div>

          <div className="form-control">
            <label className="label">
              <span className="label-text font-medium">Capacity</span>
            </label>
            <input
              type="number"
              placeholder="Min guests"
              className="input input-bordered w-32 min-h-[44px]"
              value={filters.capacity}
              onChange={(e) => handleChange('capacity', e.target.value)}
            />
          </div>

          <button 
            className="btn btn-ghost gentle-lift min-h-[44px]" 
            onClick={onClearFilters}
          >
            Clear Filters
          </button>
        </div>
      </div>
    </div>
  );
}
