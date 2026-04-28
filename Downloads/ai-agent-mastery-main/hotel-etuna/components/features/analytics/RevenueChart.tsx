/**
 * RevenueChart Component
 * 
 * Purpose: Display revenue chart for properties
 * Location: /components/features/analytics/RevenueChart.tsx
 * 
 * Features:
 * - Line or bar chart visualization
 * - Date range selection
 * - Revenue breakdown
 * - Trend analysis
 * - Responsive design
 */

'use client';

import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/Card';
import { DollarSign, TrendingUp } from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import LoadingSpinner from '@/components/shared/LoadingSpinner';
import EmptyState from '@/components/shared/EmptyState';

interface RevenueData {
  date: string;
  revenue: number;
  bookings: number;
  averageBookingValue: number;
}

interface RevenueChartProps {
  data: RevenueData[];
  period?: 'day' | 'week' | 'month';
  onPeriodChange?: (period: 'day' | 'week' | 'month') => void;
  loading?: boolean;
  className?: string;
}

export default function RevenueChart({
  data,
  period = 'month',
  onPeriodChange,
  loading = false,
  className = '',
}: RevenueChartProps) {
  const [selectedPeriod, setSelectedPeriod] = useState(period);

  const handlePeriodChange = (newPeriod: 'day' | 'week' | 'month') => {
    setSelectedPeriod(newPeriod);
    onPeriodChange?.(newPeriod);
  };

  const totalRevenue = data.reduce((sum, d) => sum + d.revenue, 0);
  const maxRevenue = Math.max(...data.map((d) => d.revenue), 1);
  const averageRevenue = data.length > 0 ? totalRevenue / data.length : 0;

  if (loading) {
    return (
      <Card className={cn('', className)}>
        <CardContent className="p-6">
          <div className="flex items-center justify-center min-h-64">
            <LoadingSpinner size="lg" text="Loading revenue data..." />
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
            icon={<DollarSign className="w-16 h-16 text-base-content/40" />}
            title="No Revenue Data"
            description="No revenue data available for the selected period."
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
            <DollarSign className="w-5 h-5" />
            Revenue
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
                aria-label={`View ${p} revenue`}
              >
                {p.charAt(0).toUpperCase() + p.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Total Revenue */}
        <div className="mb-6 p-4 bg-primary/10 rounded-lg">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-base-content/70">Total Revenue</span>
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-success" />
              <span className="text-2xl font-bold text-primary">N$ {totalRevenue.toFixed(2)}</span>
            </div>
          </div>
          <div className="mt-2 text-xs text-base-content/60">
            Average: N$ {averageRevenue.toFixed(2)} per {selectedPeriod}
          </div>
        </div>

        {/* Chart */}
        <div className="space-y-2">
          {data.map((item, index) => (
            <div key={index} className="space-y-1">
              <div className="flex items-center justify-between text-sm">
                <span className="text-base-content/70">{item.date}</span>
                <span className="font-medium">N$ {item.revenue.toFixed(2)}</span>
              </div>
              <div className="w-full h-6 bg-base-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary transition-all duration-300"
                  style={{ width: `${(item.revenue / maxRevenue) * 100}%` }}
                />
              </div>
              <div className="flex items-center justify-between text-xs text-base-content/60">
                <span>{item.bookings} bookings</span>
                <span>Avg: N$ {item.averageBookingValue.toFixed(2)}</span>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
