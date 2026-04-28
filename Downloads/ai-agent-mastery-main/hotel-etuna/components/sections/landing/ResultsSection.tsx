/**
 * Results Section Component
 * 
 * Purpose: Landing page section displaying platform capabilities and features
 * Location: /components/sections/landing/ResultsSection.tsx
 * 
 * Features:
 * - 4 feature cards highlighting platform capabilities
 * - Capability-focused messaging (not specific metrics)
 * - Professional presentation
 * 
 * Design System:
 * - Uses semantic tokens: text-base-content, bg-base-100
 * - Grid: grid-cols-1 md:grid-cols-2 lg:grid-cols-4
 * - Section padding: py-20 md:py-32
 * 
 * Accessibility:
 * - Proper heading hierarchy (h2)
 * - Semantic section element
 * - ARIA labels for metrics
 * 
 * @module ResultsSection
 */

import { TrendingUp, Calendar, Users, Star } from 'lucide-react';

const metrics = [
  {
    icon: TrendingUp,
    value: '24/7',
    label: 'Always Available',
    description: 'AI handles inquiries around the clock',
    color: 'primary' as const,
  },
  {
    icon: Calendar,
    value: 'Direct',
    label: 'Booking Engine',
    description: 'Convert inquiries to reservations automatically',
    color: 'success' as const,
  },
  {
    icon: Users,
    value: 'Lean',
    label: 'Operations',
    description: 'Automate repetitive tasks and workflows',
    color: 'info' as const,
  },
  {
    icon: Star,
    value: 'Unified',
    label: 'Platform',
    description: 'Everything you need in one integrated system',
    color: 'warning' as const,
  },
];

export default function ResultsSection() {
  return (
    <section className="py-20 md:py-32 bg-base-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold font-display mb-6 text-balance">
            What Hotel Etuna Delivers
          </h2>
          <p className="text-xl text-base-content/90 max-w-2xl mx-auto">
            A comprehensive platform designed to improve inquiry response, streamline booking conversion, and enhance operational efficiency.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {metrics.map((metric, index) => (
            <MetricCard key={index} {...metric} />
          ))}
        </div>
      </div>
    </section>
  );
}

interface MetricCardProps {
  icon: React.ComponentType<{ className?: string }>;
  value: string;
  label: string;
  description: string;
  color: 'primary' | 'success' | 'info' | 'warning';
}

function MetricCard({ icon: Icon, value, label, description, color }: MetricCardProps) {
  const colorClasses = {
    primary: 'bg-primary/10 text-primary',
    success: 'bg-success/10 text-success',
    info: 'bg-info/10 text-info',
    warning: 'bg-warning/10 text-warning',
  };

  return (
    <div className="card bg-base-100 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 text-center">
      <div className="card-body p-8">
        <div className={`w-16 h-16 rounded-xl ${colorClasses[color]} flex items-center justify-center mb-6 mx-auto`}>
          <Icon className="w-8 h-8" />
        </div>
        <div className="text-4xl md:text-5xl font-bold font-display mb-2 text-base-content" aria-label={`${label}: ${value}`}>
          {value}
        </div>
        <h3 className="text-xl font-semibold font-display mb-2">{label}</h3>
        <p className="text-sm text-base-content/90">{description}</p>
      </div>
    </div>
  );
}
