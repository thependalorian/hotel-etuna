/**
 * Feature Card Component
 * 
 * Purpose: Reusable card component for displaying platform features
 * Location: /components/sections/landing/cards/FeatureCard.tsx
 * 
 * Features:
 * - Icon with background
 * - Title and description
 * - Feature list with checkmarks
 * 
 * Design System:
 * - Uses semantic tokens: text-base-content, bg-base-200
 * - Card shadows: shadow-lg with hover:shadow-xl
 * 
 * Accessibility:
 * - Semantic HTML structure
 * - Proper heading hierarchy (h3)
 * 
 * @param {Object} feature - Feature data object
 * @param {string} feature.title - Feature title
 * @param {string} feature.description - Feature description
 * @param {string[]} feature.features - List of feature items
 * @param {React.ComponentType} feature.icon - Icon component
 * 
 * @module FeatureCard
 */

import { CheckCircle2 } from 'lucide-react';
import { LucideIcon } from 'lucide-react';

interface FeatureCardProps {
  title: string;
  description: string;
  features: string[];
  icon: LucideIcon;
}

export default function FeatureCard({ title, description, features, icon: Icon }: FeatureCardProps) {
  return (
    <div className="card bg-base-200 shadow-lg hover:shadow-xl transition-shadow">
      <div className="card-body p-8">
        <div className="w-16 h-16 rounded-xl bg-primary/10 flex items-center justify-center mb-6">
          <Icon className="w-8 h-8 text-primary" />
        </div>
        <h3 className="text-2xl font-bold font-display mb-3">{title}</h3>
        <p className="text-base-content/90 mb-6 leading-relaxed">{description}</p>
        <ul className="space-y-2">
          {features.map((item, idx) => (
            <li key={idx} className="flex items-center gap-2 text-sm text-base-content/80">
              <CheckCircle2 className="w-4 h-4 text-success flex-shrink-0" />
              {item}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
