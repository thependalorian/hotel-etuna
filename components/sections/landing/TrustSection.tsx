/**
 * Trust Section Component
 * 
 * Purpose: Landing page section displaying trust indicators and social proof
 * Location: /components/sections/landing/TrustSection.tsx
 * 
 * Features:
 * - Trust badges and indicators
 * - Security and compliance information
 * - Social proof elements
 * 
 * Design System:
 * - Uses semantic tokens: text-base-content, bg-base-200
 * - Grid: grid-cols-1 md:grid-cols-2 lg:grid-cols-4
 * - Section padding: py-20 md:py-32
 * 
 * Accessibility:
 * - Proper heading hierarchy (h2)
 * - Semantic section element
 * - ARIA labels for badges
 * 
 * @module TrustSection
 */

import { Shield, Lock, CheckCircle2, Clock, CreditCard, Headphones } from 'lucide-react';

const trustIndicators = [
  {
    icon: Shield,
    title: '24-Hour Security',
    description: 'Peace of mind throughout your stay',
    color: 'primary' as const,
  },
  {
    icon: Clock,
    title: 'Trade Fair Proximity',
    description: 'About 500m from Ongwediva Trade Fair Centre',
    color: 'success' as const,
  },
  {
    icon: CreditCard,
    title: 'NFC Payments',
    description: 'Pay on property with card and NFC',
    color: 'info' as const,
  },
  {
    icon: Headphones,
    title: 'Sofia Concierge',
    description: 'Guest support when you need it',
    color: 'warning' as const,
  },
];

const complianceBadges = [
  'Regulatory Compliant',
  'GDPR Compliant',
  'Data Protection Standards',
  'Secure Payment Processing',
];

export default function TrustSection() {
  return (
    <section className="py-20 md:py-32 bg-base-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold font-display mb-6 text-balance">
            Why guests choose Hotel Etuna
          </h2>
          <p className="text-xl text-base-content/90 max-w-2xl mx-auto">
            Reliable hospitality in northern Oshana—care, comfort, and a memorable table.
          </p>
        </div>

        {/* Trust Indicators */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-16">
          {trustIndicators.map((indicator, index) => (
            <TrustIndicatorCard key={index} {...indicator} />
          ))}
        </div>

        {/* Compliance Badges */}
        <div className="card bg-base-100 shadow-lg">
          <div className="card-body p-8">
            <div className="text-center mb-6">
              <h3 className="text-2xl font-bold font-display mb-2">Compliance & Security</h3>
              <p className="text-base-content/90">We meet the highest standards for data protection and security</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {complianceBadges.map((badge, index) => (
                <div key={index} className="flex items-center gap-2 justify-center md:justify-start">
                  <CheckCircle2 className="w-5 h-5 text-success flex-shrink-0" />
                  <span className="text-sm font-medium text-base-content">{badge}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

interface TrustIndicatorCardProps {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
  color: 'primary' | 'success' | 'info' | 'warning';
}

function TrustIndicatorCard({ icon: Icon, title, description, color }: TrustIndicatorCardProps) {
  const colorClasses = {
    primary: 'bg-primary/10 text-primary',
    success: 'bg-success/10 text-success',
    info: 'bg-info/10 text-info',
    warning: 'bg-warning/10 text-warning',
  };

  return (
    <div className="card bg-base-100 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 text-center">
      <div className="card-body p-6">
        <div className={`w-16 h-16 rounded-xl ${colorClasses[color]} flex items-center justify-center mb-4 mx-auto`}>
          <Icon className="w-8 h-8" />
        </div>
        <h3 className="text-lg font-semibold font-display mb-2">{title}</h3>
        <p className="text-sm text-base-content/90">{description}</p>
      </div>
    </div>
  );
}
