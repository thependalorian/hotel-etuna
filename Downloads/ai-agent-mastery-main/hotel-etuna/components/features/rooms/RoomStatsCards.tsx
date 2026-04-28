/**
 * Room Stats Cards Component
 * 
 * Purpose: Display room statistics in card grid format
 * Location: /components/features/rooms/RoomStatsCards.tsx
 * 
 * Features:
 * - 4 stat cards (Total, Available, Occupied, Occupancy Rate)
 * - Icons and color coding
 * - Staggered animations
 * 
 * Design System:
 * - Uses semantic tokens: text-base-content, bg-base-100
 * - Card shadows: shadow-lg with hover:shadow-xl
 * - Animation: animate-slide-up with delays
 * 
 * Accessibility:
 * - Semantic HTML structure
 * - Proper heading hierarchy
 * 
 * @param {Object} stats - Room statistics object
 * @param {number} stats.totalRooms - Total number of rooms
 * @param {number} stats.availableRooms - Number of available rooms
 * @param {number} stats.occupiedRooms - Number of occupied rooms
 * @param {number} stats.occupancyRate - Occupancy rate percentage
 * 
 * @module RoomStatsCards
 */

import { Building, Bed, Users } from 'lucide-react';
import { LucideIcon } from 'lucide-react';

interface RoomStats {
  totalRooms: number;
  availableRooms: number;
  occupiedRooms: number;
  occupancyRate: number;
}

interface StatCard {
  label: string;
  value: string;
  icon: LucideIcon;
  color: string;
  bg: string;
}

export default function RoomStatsCards({ stats }: { stats: RoomStats }) {
  const statCards: StatCard[] = [
    { 
      label: 'Total Rooms', 
      value: stats.totalRooms.toString(), 
      icon: Building, 
      color: 'text-primary', 
      bg: 'bg-primary/10' 
    },
    { 
      label: 'Available Rooms', 
      value: stats.availableRooms.toString(), 
      icon: Bed, 
      color: 'text-success', 
      bg: 'bg-success/10' 
    },
    { 
      label: 'Occupied Rooms', 
      value: stats.occupiedRooms.toString(), 
      icon: Users, 
      color: 'text-warning', 
      bg: 'bg-warning/10' 
    },
    { 
      label: 'Occupancy Rate', 
      value: `${stats.occupancyRate.toFixed(1)}%`, 
      icon: Building, 
      color: 'text-info', 
      bg: 'bg-info/10' 
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {statCards.map((stat, index) => {
        const Icon = stat.icon;
        return (
          <div 
            key={stat.label}
            className="card bg-base-100 shadow-lg card-hover animate-slide-up"
            style={{ animationDelay: `${index * 100}ms` }}
          >
            <div className="card-body">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="text-sm font-medium text-base-content/60 mb-1">{stat.label}</p>
                  <p className="text-3xl font-bold text-base-content">{stat.value}</p>
                </div>
                <div className={`w-14 h-14 rounded-xl ${stat.bg} flex items-center justify-center flex-shrink-0 shadow-sm`}>
                  <Icon className={`w-7 h-7 ${stat.color}`} />
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
