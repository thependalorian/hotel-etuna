/**
 * Menu Stats Cards Component
 * 
 * Purpose: Display menu statistics in card grid format
 * Location: /components/features/menu/MenuStatsCards.tsx
 * 
 * Features:
 * - 4 stat cards (Total Items, Available, Categories, Avg Price)
 * - Icons and color coding
 * - Staggered animations
 * 
 * Design System:
 * - Uses semantic tokens: text-base-content, bg-base-100
 * - Card shadows: shadow-lg with  * 
 * Accessibility:
 * - Semantic HTML structure
 * 
 * @param {Object} stats - Menu statistics object
 * 
 * @module MenuStatsCards
 */

import { FileText, CheckCircle2, Folder, DollarSign } from 'lucide-react';

interface MenuStats {
  totalItems: number;
  availableItems: number;
  categories: number;
  averagePrice: number;
}

interface MenuStatsCardsProps {
  stats: MenuStats;
}

export default function MenuStatsCards({ stats }: MenuStatsCardsProps) {
  const statCards = [
    { 
      label: 'Total Items', 
      value: stats.totalItems.toString(), 
      icon: FileText, 
      color: 'text-primary', 
      bg: 'bg-primary/10' 
    },
    { 
      label: 'Available', 
      value: stats.availableItems.toString(), 
      icon: CheckCircle2, 
      color: 'text-success', 
      bg: 'bg-success/10',
      desc: `${stats.totalItems > 0 ? ((stats.availableItems / stats.totalItems) * 100).toFixed(1) : 0}% available`
    },
    { 
      label: 'Categories', 
      value: stats.categories.toString(), 
      icon: Folder, 
      color: 'text-accent', 
      bg: 'bg-accent/10' 
    },
    { 
      label: 'Avg Price', 
      value: `N$${stats.averagePrice.toFixed(2)}`, 
      icon: DollarSign, 
      color: 'text-warning', 
      bg: 'bg-warning/10' 
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
      {statCards.map((stat, index) => (
        <div 
          key={stat.label}
          className="card bg-base-100 card-hover animate-slide-up"
          style={{ animationDelay: `${index * 100}ms` }}
        >
          <div className="card-body">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="text-sm font-medium text-base-content/60 mb-1">{stat.label}</p>
                <p className={`text-3xl font-bold ${stat.color} mb-1`}>{stat.value}</p>
                {stat.desc && (
                  <p className="text-xs text-base-content/50">{stat.desc}</p>
                )}
              </div>
              <div className={`w-14 h-14 rounded-etuna-card ${stat.bg} flex items-center justify-center flex-shrink-0`}>
                <stat.icon className={`w-6 h-6 ${stat.color}`} />
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
