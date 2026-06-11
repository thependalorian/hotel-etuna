/**
 * Analytics Dashboard Page
 *
 * Purpose: Display key business metrics and performance for Hotel Etuna.
 * Location: /app/(dashboard)/analytics/page.tsx
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { Download, BarChart3 } from 'lucide-react';
import LoadingSpinner from '@/components/shared/LoadingSpinner';
import EmptyState from '@/components/shared/EmptyState';
import AnalyticsFilters from '@/components/features/analytics/AnalyticsFilters';
import MetricCard from '@/components/features/analytics/MetricCard';
import RevenueByProperty from '@/components/features/analytics/RevenueByProperty';
import BookingTrends from '@/components/features/analytics/BookingTrends';
import PerformanceMetrics from '@/components/features/analytics/PerformanceMetrics';
import { TrendingUp, Users, DollarSign, Calendar } from 'lucide-react';
import { apiUrl } from '@/lib/utils/api-url';
import { securityLogger } from '@/lib/utils/security-logger.client';
import { formatCurrencyNAD } from '@/lib/formatters';

interface AnalyticsData {
  revenue: {
    totalRevenue: number;
    growthRate: number;
    averageOrderValue: number;
    revenueByProperty: Array<{
      propertyId: string;
      propertyName: string;
      revenue: number;
      percentage: number;
    }>;
  };
  bookings: {
    totalBookings: number;
    occupancyRate: number;
    averageLengthOfStay: number;
    bookingTrends: Array<{
      date: string;
      bookings: number;
      revenue: number;
    }>;
  };
  guests: {
    totalGuests: number;
    newGuests: number;
    returningGuests: number;
    averageGuestRating: number;
  };
  performance: {
    bookingConversionRate: number;
    revenuePerAvailableRoom: number;
    customerLifetimeValue: number;
  };
}

export default function AnalyticsPage() {
  const { data: session } = useSession();
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState<{ from: Date; to: Date }>({
    from: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
    to: new Date(),
  });

  const fetchAnalyticsData = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        dashboard: 'true',
        dateFrom: dateRange.from.toISOString(),
        dateTo: dateRange.to.toISOString(),
      });

      const response = await fetch(apiUrl(`/api/analytics?${params}`));
      if (response.ok) {
        const analyticsData = await response.json();
        setData(analyticsData);
      } else {
        securityLogger.warn('[AnalyticsPage] API returned non-OK status:', response.status);
        setData(null);
      }
    } catch (error) {
      securityLogger.error('[AnalyticsPage] Error fetching analytics data:', error);
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [dateRange, session]); // Added session to dependencies

  useEffect(() => {
    if (session?.user) {
      fetchAnalyticsData();
    } else {
      setLoading(false);
    }
  }, [dateRange, session, fetchAnalyticsData]); // Added fetchAnalyticsData to dependencies

  const exportReport = async (format: 'csv' | 'pdf') => {
    try {
      const response = await fetch(apiUrl('/api/analytics'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'custom_report',
          config: {
            metrics: ['revenue', 'bookings', 'guests', 'performance'],
            filters: {
              tenantId: session?.user?.tenantId,
              dateFrom: dateRange.from,
              dateTo: dateRange.to,
            },
            format,
          },
        }),
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `hotel-etuna-analytics.${format}`;
        a.click();
        window.URL.revokeObjectURL(url);
      }
    } catch (error) {
      securityLogger.error('Error exporting report:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <LoadingSpinner size="lg" text="Loading analytics..." />
      </div>
    );
  }

  if (!data) {
    return (
      <EmptyState
        icon={BarChart3}
        title="No analytics data available"
        description="Start creating bookings to see performance metrics."
      />
    );
  }

  const metrics = [
    { 
      title: 'Total Revenue', 
      value: formatCurrencyNAD(data.revenue.totalRevenue), 
      icon: DollarSign, 
      color: 'text-primary', 
      bg: 'bg-primary/10',
      desc: `+${data.revenue.growthRate.toFixed(1)}% from last period`
    },
    { 
      title: 'Total Bookings', 
      value: data.bookings.totalBookings.toString(), 
      icon: Calendar, 
      color: 'text-secondary', 
      bg: 'bg-secondary/10',
      desc: `${data.bookings.occupancyRate.toFixed(1)}% occupancy rate`
    },
    { 
      title: 'Total Guests', 
      value: data.guests.totalGuests.toString(), 
      icon: Users, 
      color: 'text-accent', 
      bg: 'bg-accent/10',
      desc: `${data.guests.newGuests} new this period`
    },
    { 
      title: 'Avg Order Value', 
      value: `N$${data.revenue.averageOrderValue.toFixed(2)}`, 
      icon: TrendingUp, 
      color: 'text-warning', 
      bg: 'bg-warning/10',
      desc: `${data.performance.bookingConversionRate.toFixed(1)}% conversion rate`
    },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="etuna-page-title mb-2">Analytics</h1>
          <p className="text-nude-600">
            Hotel Etuna performance metrics
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full border border-nude-200 text-nude-800 font-medium hover:bg-nude-50 transition-colors min-h-[44px]"
            onClick={() => exportReport('csv')}
          >
            <Download className="w-4 h-4" />
            Export CSV
          </button>
          <button
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full bg-khaki-600 text-white font-bold hover:bg-khaki-700 transition-colors min-h-[44px]"
            onClick={() => exportReport('pdf')}
          >
            <Download className="w-4 h-4" />
            Export PDF
          </button>
        </div>
      </div>

      <AnalyticsFilters
        selectedProperty="all"
        dateRange={dateRange}
        onPropertyChange={() => {}}
        onDateRangeChange={(field, date) => setDateRange(prev => ({ ...prev, [field]: date }))}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {metrics.map((metric, index) => (
          <MetricCard key={metric.title} {...metric} index={index} />
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <RevenueByProperty revenueByProperty={data.revenue.revenueByProperty} />
        <BookingTrends bookingTrends={data.bookings.bookingTrends} />
      </div>

      <PerformanceMetrics performance={data.performance} />
    </div>
  );
}
