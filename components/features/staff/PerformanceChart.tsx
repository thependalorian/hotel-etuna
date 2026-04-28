/**
 * PerformanceChart Component
 * 
 * Purpose: Display staff performance metrics chart
 * Location: /components/features/staff/PerformanceChart.tsx
 * 
 * Features:
 * - Performance metrics visualization
 * - Individual or team comparison
 * - Date range selection
 * - Key performance indicators
 * - Responsive design
 */

'use client';

import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/Card';
import { AlertTriangle, Check, TrendingUp, User, Award } from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import LoadingSpinner from '@/components/shared/LoadingSpinner';
import EmptyState from '@/components/shared/EmptyState';

interface PerformanceData {
  staffId: string;
  staffName: string;
  metric: string;
  value: number;
  target?: number;
  period: string;
}

interface PerformanceChartProps {
  data: PerformanceData[];
  metric?: 'sales' | 'bookings' | 'satisfaction' | 'attendance';
  onMetricChange?: (metric: 'sales' | 'bookings' | 'satisfaction' | 'attendance') => void;
  loading?: boolean;
  className?: string;
}

export default function PerformanceChart({
  data,
  metric = 'sales',
  onMetricChange,
  loading = false,
  className = '',
}: PerformanceChartProps) {
  const [selectedMetric, setSelectedMetric] = useState(metric);

  const handleMetricChange = (newMetric: 'sales' | 'bookings' | 'satisfaction' | 'attendance') => {
    setSelectedMetric(newMetric);
    onMetricChange?.(newMetric);
  };

  const metricLabels = {
    sales: 'Sales',
    bookings: 'Bookings',
    satisfaction: 'Satisfaction',
    attendance: 'Attendance',
  };

  const filteredData = data.filter((d) => d.metric === selectedMetric);
  const maxValue = Math.max(...filteredData.map((d) => d.value), 1);

  if (loading) {
    return (
      <Card className={cn('', className)}>
        <CardContent className="p-6">
          <div className="flex items-center justify-center min-h-64">
            <LoadingSpinner size="lg" text="Loading performance data..." />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (filteredData.length === 0) {
    return (
      <Card className={cn('', className)}>
        <CardContent className="p-6">
          <EmptyState
            icon={<Award className="w-16 h-16 text-base-content/40" />}
            title="No Performance Data"
            description={`No ${metricLabels[selectedMetric].toLowerCase()} data available.`}
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
            <Award className="w-5 h-5" />
            Staff Performance
          </h3>
          <div className="flex items-center gap-2">
            {(Object.keys(metricLabels) as Array<keyof typeof metricLabels>).map((m) => (
              <button
                key={m}
                onClick={() => handleMetricChange(m)}
                className={cn(
                  'btn btn-sm min-h-[44px]',
                  selectedMetric === m ? 'btn-primary' : 'btn-ghost'
                )}
                aria-label={`View ${metricLabels[m]} performance`}
              >
                {metricLabels[m]}
              </button>
            ))}
          </div>
        </div>

        {/* Chart */}
        <div className="space-y-3">
          {filteredData.map((item, index) => {
            const percentage = (item.value / maxValue) * 100;
            const meetsTarget = item.target ? item.value >= item.target : null;
            
            return (
              <div key={index} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4 text-base-content/60" />
                    <span className="font-medium">{item.staffName}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    {meetsTarget !== null && (
                      <span className={cn(
                        'text-xs',
                        meetsTarget ? 'text-success' : 'text-warning'
                      )}>
                        {meetsTarget ? (
                          <Check className="inline h-3.5 w-3.5" aria-hidden />
                        ) : (
                          <AlertTriangle className="inline h-3.5 w-3.5" aria-hidden />
                        )}{' '}
                        Target: {item.target}
                      </span>
                    )}
                    <span className="font-bold">{item.value}</span>
                  </div>
                </div>
                <div className="w-full h-4 bg-base-200 rounded-full overflow-hidden">
                  <div
                    className={cn(
                      'h-full transition-all duration-300',
                      meetsTarget === true ? 'bg-success' :
                      meetsTarget === false ? 'bg-warning' :
                      'bg-primary'
                    )}
                    style={{ width: `${percentage}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
