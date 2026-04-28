/**
 * Analytics Dashboard Page
 * 
 * Purpose: Display business analytics and performance metrics
 * Location: /app/(dashboard)/analytics/page.tsx
 * 
 * Features:
 * - Key metrics cards
 * - Revenue by property
 * - Booking trends
 * - Performance metrics
 * - Export functionality
 * 
 * Design System:
 * - Uses semantic tokens: text-base-content, bg-base-100
 * - Button size: min-h-[44px] (Fitt's Law)
 * 
 * Accessibility:
 * - Proper heading hierarchy (h1)
 * - Semantic HTML structure
 * 
 * @module AnalyticsPage
 */

'use client';

import { useState, useEffect } from 'react';
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
  const [selectedProperty, setSelectedProperty] = useState<string>('all');
  const [dateRange, setDateRange] = useState<{ from: Date; to: Date }>({
    from: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
    to: new Date(),
  });

  useEffect(() => {
    // Only fetch if session is available
    if (session?.user) {
      fetchAnalyticsData();
    } else {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedProperty, dateRange, session]);

  const fetchAnalyticsData = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        dashboard: 'true',
        ...(selectedProperty !== 'all' && { propertyId: selectedProperty }),
        dateFrom: dateRange.from.toISOString(),
        dateTo: dateRange.to.toISOString(),
      });

      const response = await fetch(apiUrl(`/api/analytics?${params}`));
      if (response.ok) {
        const analyticsData = await response.json();
        setData(analyticsData);
      } else {
        // Handle non-OK responses gracefully
        console.warn('[AnalyticsPage] API returned non-OK status:', response.status);
        setData(null);
      }
    } catch (error) {
      console.error('[AnalyticsPage] Error fetching analytics data:', error);
      // Set data to null to show empty state instead of crashing
      setData(null);
    } finally {
      setLoading(false);
    }
  };

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
              propertyId: selectedProperty !== 'all' ? selectedProperty : undefined,
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
        a.download = `analytics-report.${format}`;
        a.click();
        window.URL.revokeObjectURL(url);
      }
    } catch (error) {
      console.error('Error exporting report:', error);
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
        description="Start creating bookings to see analytics."
      />
    );
  }

  const metrics = [
    { 
      title: 'Total Revenue', 
      value: `N$${data.revenue.totalRevenue.toLocaleString()}`, 
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
      desc: `${data.guests.newGuests} new guests`
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
          <h1 className="buffr-page-title mb-2">Analytics Dashboard</h1>
          <p className="text-base-content/70">
            Track your hospitality business performance
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            className="btn btn-outline gentle-lift min-h-[44px]"
            onClick={() => exportReport('csv')}
          >
            <Download className="w-5 h-5 mr-2" />
            Export CSV
          </button>
          <button
            className="btn btn-primary gentle-lift min-h-[44px]"
            onClick={() => exportReport('pdf')}
          >
            <Download className="w-5 h-5 mr-2" />
            Export PDF
          </button>
        </div>
      </div>

      <AnalyticsFilters
        selectedProperty={selectedProperty}
        dateRange={dateRange}
        onPropertyChange={setSelectedProperty}
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
