/**
 * Dashboard Stats Cards Component
 * 
 * Purpose: Display key dashboard statistics
 * Location: /components/features/DashboardStatsCards.tsx
 * 
 * Features:
 * - 4 stat cards (Properties, Bookings, Orders, Guests)
 * - Change indicators with trend arrows
 * - Icons and color coding
 * - Staggered animations
 * 
 * Design System:
 * - Uses semantic tokens: text-base-content, bg-base-100
 * - Card shadows: shadow-lg with hover:shadow-xl
 * 
 * Accessibility:
 * - Semantic HTML structure
 * 
 * @param {Object} stats - Dashboard statistics object
 * 
 * @module DashboardStatsCards
 */

import { Building, Calendar, Utensils, Users, TrendingUp } from 'lucide-react';
import { LucideIcon } from 'lucide-react';

interface DashboardStats {
  properties: { total: number; change: number };
  bookings: { total: number; change: number };
  orders: { total: number; change: number };
  guests: { total: number; change: number };
}

interface DashboardStatsCardsProps {
  stats: DashboardStats;
}

export default function DashboardStatsCards({ stats }: DashboardStatsCardsProps) {
  const statCards = [
    {
      title: 'Active Properties',
      value: stats.properties.total.toString(),
      change: stats.properties.change,
      icon: Building,
      color: 'text-primary',
      bgColor: 'bg-primary/10',
    },
    {
      title: 'Total Bookings',
      value: stats.bookings.total.toString(),
      change: stats.bookings.change,
      icon: Calendar,
      color: 'text-success',
      bgColor: 'bg-success/10',
    },
    {
      title: 'Total Orders',
      value: stats.orders.total.toString(),
      change: stats.orders.change,
      icon: Utensils,
      color: 'text-warning',
      bgColor: 'bg-warning/10',
    },
    {
      title: 'Active Guests',
      value: stats.guests.total.toString(),
      change: stats.guests.change,
      icon: Users,
      color: 'text-info',
      bgColor: 'bg-info/10',
    },
  ];

  return (
    <div className="space-y-4">
      <div className="px-1">
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-ink-400">
          Performance at a glance
        </p>
        <p className="mt-1 text-sm text-ink-600">
          Key counts vs last month—scan once, then drill into detail from the sidebar.
        </p>
      </div>
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
      {statCards.map((stat, index) => {
        const Icon = stat.icon;
        const changeValue = stat.change >= 0 ? `+${stat.change.toFixed(1)}%` : `${stat.change.toFixed(1)}%`;
        const isPositive = stat.change >= 0;
        return (
          <div 
            key={stat.title} 
            className="card border border-base-200 bg-base-100 shadow-lg card-hover card-interactive animate-slide-up group"
            style={{ animationDelay: `${index * 100}ms` }}
          >
            <div className="card-body p-6">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <p className="mb-2 text-xs font-bold uppercase tracking-wide text-ink-500">
                    {stat.title}
                  </p>
                  <p className="mb-3 font-display text-3xl font-bold text-ink-950 md:text-4xl">
                    {stat.value}
                  </p>
                  <div className="flex items-center gap-2 text-sm">
                    <div className={`flex items-center gap-1 px-2 py-1 rounded-md ${isPositive ? 'bg-success/10' : 'bg-error/10'}`}>
                      <TrendingUp className={`w-4 h-4 ${isPositive ? 'text-success' : 'text-error rotate-180'}`} />
                      <span className={`font-semibold ${isPositive ? 'text-success' : 'text-error'}`}>
                        {changeValue}
                      </span>
                    </div>
                    <span className="text-xs text-ink-500">vs last month</span>
                  </div>
                </div>
                <div className={`w-16 h-16 rounded-2xl ${stat.bgColor} flex items-center justify-center flex-shrink-0 shadow-md group-hover:scale-110 transition-transform duration-300`}>
                  <Icon className={`w-8 h-8 ${stat.color}`} />
                </div>
              </div>
            </div>
          </div>
        );
      })}
      </div>
    </div>
  );
}
