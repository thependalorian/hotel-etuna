/**
 * Metric Card Component
 * 
 * Purpose: Display individual analytics metric in card format
 * Location: /components/features/analytics/MetricCard.tsx
 * 
 * Features:
 * - Metric title and value
 * - Icon with color coding
 * - Description/subtitle
 * - Staggered animations
 * 
 * Design System:
 * - Uses semantic tokens: text-base-content, bg-base-100
 * - Card shadows: shadow-lg with hover:shadow-xl
 * 
 * Accessibility:
 * - Semantic HTML structure
 * 
 * @param {string} title - Metric title
 * @param {string} value - Metric value
 * @param {string} desc - Optional description
 * @param {React.ComponentType} icon - Icon component
 * @param {string} color - Text color class
 * @param {string} bg - Background color class
 * @param {number} index - Index for animation delay
 * 
 * @module MetricCard
 */

import { LucideIcon } from 'lucide-react';

interface MetricCardProps {
  title: string;
  value: string;
  desc?: string;
  icon: LucideIcon;
  color: string;
  bg: string;
  index: number;
}

export default function MetricCard({ title, value, desc, icon: Icon, color, bg, index }: MetricCardProps) {
  return (
    <div 
      className="card bg-base-100 shadow-lg card-hover animate-slide-up"
      style={{ animationDelay: `${index * 100}ms` }}
    >
      <div className="card-body">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <p className="text-sm font-medium text-base-content/60 mb-1">{title}</p>
            <p className={`text-3xl font-bold ${color} mb-1`}>{value}</p>
            {desc && (
              <p className="text-xs text-base-content/50">{desc}</p>
            )}
          </div>
          <div className={`w-14 h-14 rounded-xl ${bg} flex items-center justify-center flex-shrink-0 shadow-sm`}>
            <Icon className={`w-7 h-7 ${color}`} />
          </div>
        </div>
      </div>
    </div>
  );
}
