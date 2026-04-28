/**
 * Problem Card Component
 * 
 * Purpose: Reusable card component for displaying problem statements
 * Location: /components/sections/landing/cards/ProblemCard.tsx
 * 
 * Features:
 * - Icon with color-coded background
 * - Title and description
 * - Hover effects
 * 
 * Design System:
 * - Uses semantic tokens: text-base-content, bg-base-100
 * - Card shadows: shadow-lg with hover:shadow-xl
 * - Hover animation: translateY(-1px)
 * 
 * Accessibility:
 * - Semantic HTML structure
 * - Proper heading hierarchy (h3)
 * 
 * @param {Object} problem - Problem data object
 * @param {string} problem.title - Problem title
 * @param {string} problem.description - Problem description
 * @param {React.ComponentType} problem.icon - Icon component
 * @param {string} problem.color - Color variant (primary, error, warning, info)
 * 
 * @module ProblemCard
 */

import { LucideIcon } from 'lucide-react';

interface ProblemCardProps {
  title: string;
  description: string;
  icon: LucideIcon;
  color: 'primary' | 'error' | 'warning' | 'info';
}

export default function ProblemCard({ title, description, icon: Icon, color }: ProblemCardProps) {
  const colorClasses = {
    primary: 'bg-primary/10 text-primary',
    error: 'bg-error/10 text-error',
    warning: 'bg-warning/10 text-warning',
    info: 'bg-info/10 text-info',
  };

  return (
    <div className="card bg-base-100 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
      <div className="card-body p-8">
        <div className={`w-16 h-16 rounded-xl ${colorClasses[color]} flex items-center justify-center mb-6`}>
          <Icon className="w-8 h-8" />
        </div>
        <h3 className="text-2xl font-bold font-display mb-3">{title}</h3>
        <p className="text-base-content/90 leading-relaxed">{description}</p>
      </div>
    </div>
  );
}
