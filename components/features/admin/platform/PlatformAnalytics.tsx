/**
 * Platform Analytics Component
 * 
 * Purpose: Component for displaying platform-wide analytics
 * Location: components/features/admin/platform/PlatformAnalytics.tsx
 * 
 * Features:
 * - Revenue analytics
 * - Booking statistics
 * - User growth metrics
 * - Property performance
 */

'use client';

import React, { useState, useEffect } from 'react';
import { apiUrl } from '@/lib/utils/api-url';
import { 
  TrendingUp, 
  TrendingDown,
  DollarSign,
  Users,
  Home,
  Calendar,
  BarChart3,
  PieChart,
  Activity
} from 'lucide-react';

interface AnalyticsData {
  revenue: {
    total: number;
    monthly: number;
    growth: number;
  };
  bookings: {
    total: number;
    active: number;
    completed: number;
    cancelled: number;
  };
  users: {
    total: number;
    newThisMonth: number;
    growth: number;
  };
  properties: {
    total: number;
    occupancy: number;
  };
  monthlyData: {
    month: string;
    revenue: number;
    bookings: number;
    users: number;
  }[];
  topProperties: {
    name: string;
    bookings: number;
    revenue: number;
  }[];
  bookingsByStatus: {
    status: string;
    count: number;
  }[];
}

interface PlatformAnalyticsProps {
  userRole: string;
}

export default function PlatformAnalytics({ userRole }: PlatformAnalyticsProps) {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState<'7d' | '30d' | '90d' | '12m'>('30d');


  const isSuperAdmin = userRole === 'super-admin';

  useEffect(() => {
    fetchAnalytics();
  }, [dateRange]);

  const fetchAnalytics = async () => {
    setLoading(true);

    try {
      const params = new URLSearchParams({ range: dateRange });
      const res = await fetch(apiUrl(`/api/admin/platform/analytics?${params}`), {
        credentials: 'include',
      });
      if (!res.ok) {
        throw new Error(`Analytics ${res.status}`);
      }
      const data = (await res.json()) as AnalyticsData;
      setAnalytics(data);
    } catch (error) {
      console.error('Error fetching analytics:', error);
      setAnalytics(null);
    }

    setLoading(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <span className="loading loading-spinner loading-lg"></span>
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="alert alert-error">
        <span>Failed to load analytics data</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Date Range Selector */}
      <div className="flex justify-end">
        <div className="btn-group">
          {(['7d', '30d', '90d', '12m'] as const).map((range) => (
            <button
              key={range}
              className={`btn btn-sm ${dateRange === range ? 'btn-primary' : 'btn-ghost'}`}
              onClick={() => setDateRange(range)}
            >
              {range === '7d' ? '7 Days' : range === '30d' ? '30 Days' : range === '90d' ? '90 Days' : '12 Months'}
            </button>
          ))}
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="stat bg-base-100 rounded-lg shadow">
          <div className="stat-figure text-success">
            <DollarSign className="w-8 h-8" />
          </div>
          <div className="stat-title">Total Revenue</div>
          <div className="stat-value text-success">
            ${analytics.revenue.total.toLocaleString()}
          </div>
          <div className="stat-desc">
            {analytics.revenue.growth >= 0 ? (
              <span className="text-success flex items-center">
                <TrendingUp className="w-4 h-4 mr-1" />
                +{analytics.revenue.growth.toFixed(1)}%
              </span>
            ) : (
              <span className="text-error flex items-center">
                <TrendingDown className="w-4 h-4 mr-1" />
                {analytics.revenue.growth.toFixed(1)}%
              </span>
            )}
            vs last period
          </div>
        </div>

        <div className="stat bg-base-100 rounded-lg shadow">
          <div className="stat-figure text-primary">
            <Calendar className="w-8 h-8" />
          </div>
          <div className="stat-title">Total Bookings</div>
          <div className="stat-value text-primary">{analytics.bookings.total}</div>
          <div className="stat-desc">
            {analytics.bookings.active} active, {analytics.bookings.completed} completed
          </div>
        </div>

        <div className="stat bg-base-100 rounded-lg shadow">
          <div className="stat-figure text-info">
            <Users className="w-8 h-8" />
          </div>
          <div className="stat-title">Total Users</div>
          <div className="stat-value text-info">{analytics.users.total}</div>
          <div className="stat-desc">
            {analytics.users.newThisMonth} new this period
          </div>
        </div>

        <div className="stat bg-base-100 rounded-lg shadow">
          <div className="stat-figure text-warning">
            <Home className="w-8 h-8" />
          </div>
          <div className="stat-title">Properties</div>
          <div className="stat-value text-warning">{analytics.properties.total}</div>
          <div className="stat-desc">
            {analytics.properties.occupancy.toFixed(1)}% avg occupancy
          </div>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Chart */}
        <div className="bg-base-100 rounded-lg shadow p-6">
          <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
            <BarChart3 className="w-5 h-5" />
            Revenue Trend
          </h3>
          <div className="h-64 flex items-end gap-2">
            {analytics.monthlyData.map((data, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-2">
                <div 
                  className="w-full bg-primary rounded-t"
                  style={{ 
                    height: `${(data.revenue / Math.max(...analytics.monthlyData.map(d => d.revenue))) * 200}px` 
                  }}
                />
                <span className="text-xs text-base-content/60">{data.month}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Bookings by Status */}
        <div className="bg-base-100 rounded-lg shadow p-6">
          <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
            <PieChart className="w-5 h-5" />
            Bookings by Status
          </h3>
          <div className="space-y-3">
            {analytics.bookingsByStatus.map((item, i) => (
              <div key={item.status} className="flex items-center gap-3">
                <div 
                  className="w-4 h-4 rounded" 
                  style={{ backgroundColor: ['#10b981', '#f59e0b', '#ef4444', '#6366f1'][i % 4] }}
                />
                <span className="flex-1 capitalize">{item.status}</span>
                <span className="font-medium">{item.count}</span>
                <span className="text-sm text-base-content/60">
                  ({((item.count / analytics.bookings.total) * 100).toFixed(1)}%)
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Top Properties */}
      <div className="bg-base-100 rounded-lg shadow p-6">
        <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
          <Activity className="w-5 h-5" />
          Top Performing Properties
        </h3>
        <div className="overflow-x-auto">
          <table className="table">
            <thead>
              <tr>
                <th>#</th>
                <th>Property</th>
                <th>Bookings</th>
                <th>Revenue</th>
                <th>Performance</th>
              </tr>
            </thead>
            <tbody>
              {analytics.topProperties.map((property, i) => (
                <tr key={i}>
                  <td className="font-medium">{i + 1}</td>
                  <td>{property.name}</td>
                  <td>{property.bookings}</td>
                  <td>${property.revenue.toLocaleString()}</td>
                  <td>
                    <div className="w-full bg-base-200 rounded-full h-2">
                      <div 
                        className="bg-success h-2 rounded-full" 
                        style={{ width: `${(property.bookings / Math.max(...analytics.topProperties.map(p => p.bookings))) * 100}%` }}
                      />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
