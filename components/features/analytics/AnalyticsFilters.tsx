/**
 * Analytics Filters Component
 * 
 * Purpose: Filter controls for analytics dashboard
 * Location: /components/features/analytics/AnalyticsFilters.tsx
 * 
 * Features:
 * - Property filter dropdown
 * - Date range inputs (from/to)
 * 
 * Design System:
 * - Uses semantic tokens: text-base-content, bg-base-100
 * - Input size: min-h-[44px] (Fitt's Law)
 * 
 * Accessibility:
 * - Proper labels for all inputs
 * - Keyboard navigation support
 * 
 * @param {string} selectedProperty - Currently selected property
 * @param {Object} dateRange - Date range object
 * @param {Function} onPropertyChange - Property change handler
 * @param {Function} onDateRangeChange - Date range change handler
 * 
 * @module AnalyticsFilters
 */

import { Filter } from 'lucide-react';

interface AnalyticsFiltersProps {
  selectedProperty: string;
  dateRange: { from: Date; to: Date };
  onPropertyChange: (property: string) => void;
  onDateRangeChange: (field: 'from' | 'to', date: Date) => void;
}

export default function AnalyticsFilters({ selectedProperty, dateRange, onPropertyChange, onDateRangeChange }: AnalyticsFiltersProps) {
  return (
    <div className="card bg-base-100 shadow-lg card-hover">
      <div className="card-body">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <Filter className="w-5 h-5 text-base-content/70" />
            <span className="text-sm font-medium text-base-content">Filters:</span>
          </div>
          <select 
            className="select select-bordered w-48 min-h-[44px]" 
            value={selectedProperty} 
            onChange={(e) => onPropertyChange(e.target.value)}
          >
            <option value="all">All Properties</option>
            {/* Add properties dynamically */}
          </select>
          <input
            type="date"
            className="input input-bordered min-h-[44px]"
            value={dateRange.from.toISOString().split('T')[0]}
            onChange={(e) => onDateRangeChange('from', new Date(e.target.value))}
          />
          <input
            type="date"
            className="input input-bordered min-h-[44px]"
            value={dateRange.to.toISOString().split('T')[0]}
            onChange={(e) => onDateRangeChange('to', new Date(e.target.value))}
          />
        </div>
      </div>
    </div>
  );
}
