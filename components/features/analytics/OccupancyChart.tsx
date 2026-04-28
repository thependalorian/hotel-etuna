/**
 * OccupancyChart Component
 * 
 * Purpose: Display occupancy rate chart for properties
 * Location: /components/features/analytics/OccupancyChart.tsx
 * 
 * Features:
 * - Line or bar chart visualization
 * - Date range selection
 * - Occupancy percentage display
 * - Trend analysis
 * - Responsive design
 */

'use client';

import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/Card';
import { BarChart3, Calendar } from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import LoadingSpinner from '@/components/shared/LoadingSpinner';
import EmptyState from '@/components/shared/EmptyState';

interface OccupancyData {
  date: string;
  occupancy: number; // Percentage 0-100
  bookings: number;
  available: number;
}

interface OccupancyChartProps {
  data: OccupancyData[];
  period?: 'day' | 'week' | 'month';
  onPeriodChange?: (period: 'day' | 'week' | 'month') => void;
  loading?: boolean;
  className?: string;
}

export default function OccupancyChart({
  data,
  period = 'month',
  onPeriodChange,
  loading = false,
  className = '',
}: OccupancyChartProps) {
  const [selectedPeriod, setSelectedPeriod] = useState(period);

  const handlePeriodChange = (newPeriod: 'day' | 'week' | 'month') => {
    setSelectedPeriod(newPeriod);
    onPeriodChange?.(newPeriod);
  };

  const maxOccupancy = Math.max(...data.map((d) => d.occupancy), 100);
  const averageOccupancy = data.length > 0
    ? data.reduce((sum, d) => sum + d.occupancy, 0) / data.length
    : 0;

  if (loading) {
    return (
      <Card className={cn('', className)}>
        <CardContent className="p-6">
          <div className="flex items-center justify-center min-h-64">
            <LoadingSpinner size="lg" text="Loading occupancy data..." />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (data.length === 0) {
    return (
      <Card className={cn('', className)}>
        <CardContent className="p-6">
          <EmptyState
            icon={<BarChart3 className="w-16 h-16 text-base-content/40" />}
            title="No Occupancy Data"
            description="No occupancy data available for the selected period."
            size="md"
          />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn('', className)}>
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold font-display flex items-center gap-2">
            <BarChart3 className="w-5 h-5" />
            Occupancy Rate
          </h3>
          <div className="flex items-center gap-2">
            {(['day', 'week', 'month'] as const).map((p) => (
              <button
                key={p}
                onClick={() => handlePeriodChange(p)}
                className={cn(
                  'btn btn-sm min-h-[44px]',
                  selectedPeriod === p ? 'btn-primary' : 'btn-ghost'
                )}
                aria-label={`View ${p} occupancy`}
              >
                {p.charAt(0).toUpperCase() + p.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Average Occupancy */}
        <div className="mb-6 p-4 bg-primary/10 rounded-lg">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-base-content/70">Average Occupancy</span>
            <span className="text-2xl font-bold text-primary">{averageOccupancy.toFixed(1)}%</span>
          </div>
        </div>

        {/* Chart */}
        <div className="space-y-2">
          {data.map((item, index) => (
            <div key={index} className="space-y-1">
              <div className="flex items-center justify-between text-sm">
                <span className="text-base-content/70">{item.date}</span>
                <span className="font-medium">{item.occupancy.toFixed(1)}%</span>
              </div>
              <div className="w-full h-6 bg-base-200 rounded-full overflow-hidden">
                <div
                  className={cn(
                    'h-full transition-all duration-300',
                    item.occupancy >= 80 ? 'bg-success' :
                    item.occupancy >= 50 ? 'bg-warning' :
                    'bg-error'
                  )}
                  style={{ width: `${(item.occupancy / maxOccupancy) * 100}%` }}
                />
              </div>
              <div className="flex items-center justify-between text-xs text-base-content/60">
                <span>{item.bookings} bookings</span>
                <span>{item.available} available</span>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
