/**
 * Analytics Filters Component
 *
 * Purpose: Date range filters for analytics dashboard.
 * Location: /components/features/analytics/AnalyticsFilters.tsx
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
    <div className="dashboard-card p-4">
      <div className="flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-2">
          <Filter className="w-5 h-5 text-nude-600" />
          <span className="text-sm font-medium text-nude-800">Filters:</span>
        </div>
        <input
          type="date"
          className="input input-bordered min-h-[44px] rounded-full border-nude-200 bg-white text-nude-800"
          value={dateRange.from.toISOString().split('T')[0]}
          onChange={(e) => {
            onDateRangeChange('from', new Date(e.target.value));
          }}
        />
        <span className="text-nude-600">to</span>
        <input
          type="date"
          className="input input-bordered min-h-[44px] rounded-full border-nude-200 bg-white text-nude-800"
          value={dateRange.to.toISOString().split('T')[0]}
          onChange={(e) => {
            onDateRangeChange('to', new Date(e.target.value));
          }}
        />
      </div>
    </div>
  );
}
