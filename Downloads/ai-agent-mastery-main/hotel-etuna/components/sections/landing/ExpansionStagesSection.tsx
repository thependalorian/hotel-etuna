/**
 * Expansion Stages Section Component
 * 
 * Purpose: Landing page section showing 3-phase platform growth
 * Location: /components/sections/landing/ExpansionStagesSection.tsx
 * 
 * Features:
 * - 3-stage timeline
 * - Progressive feature reveal
 * - Results for each stage
 * 
 * Design System:
 * - Uses semantic tokens: text-base-content, bg-base-100
 * - Grid: grid-cols-1 md:grid-cols-3
 * - Section padding: py-20 md:py-32
 * 
 * Accessibility:
 * - Proper heading hierarchy (h2, h3)
 * - Semantic section element
 * - ARIA labels for stages
 * 
 * @module ExpansionStagesSection
 */

import { MessageSquare, Calendar, Building2 } from 'lucide-react';

const stages = [
  {
    number: '1',
    icon: MessageSquare,
    title: 'Immediate Coverage',
    description: 'Sofia AI acts as your 24/7 receptionist',
    features: [
      '24/7 inquiry handling via chat, email, and phone',
      'Automatic guest capture and confirmations',
      'Property owners CC\'d on communications',
    ],
    result: 'Zero missed opportunities',
    color: 'primary' as const,
  },
  {
    number: '2',
    icon: Calendar,
    title: 'Direct Booking Engine',
    description: 'AI seamlessly integrated with your PMS',
    features: [
      'Converts inquiries in real-time into paid bookings',
      'Secure payment processing',
      'Automatic booking entry',
    ],
    result: 'Increased direct bookings',
    color: 'success' as const,
  },
  {
    number: '3',
    icon: Building2,
    title: 'Complete Operations Center',
    description: 'AI is the point of contact for all inquiries',
    features: [
      'Complete property management',
      'Restaurant operations included',
      'Business intelligence and analytics',
    ],
    result: 'Full operational control',
    color: 'info' as const,
  },
];

export default function ExpansionStagesSection() {
  return (
    <section className="py-20 md:py-32 bg-base-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold font-display mb-6 text-balance">
            Our Platform Grows With You—In 3 Clear Phases
          </h2>
          <p className="text-xl text-base-content/90 max-w-2xl mx-auto">
            Start with immediate coverage, then expand to direct bookings and complete operations management.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-stretch">
          {stages.map((stage, index) => (
            <StageCard key={index} stage={stage} isLast={index === stages.length - 1} />
          ))}
        </div>
      </div>
    </section>
  );
}

interface StageCardProps {
  stage: {
    number: string;
    icon: React.ComponentType<{ className?: string }>;
    title: string;
    description: string;
    features: string[];
    result: string;
    color: 'primary' | 'success' | 'info';
  };
  isLast: boolean;
}

function StageCard({ stage, isLast }: StageCardProps) {
  const { number, icon: Icon, title, description, features, result, color } = stage;

  const colorClasses = {
    primary: 'bg-primary/10 text-primary border-primary/20',
    success: 'bg-success/10 text-success border-success/20',
    info: 'bg-info/10 text-info border-info/20',
  };

  return (
    <div className="relative h-full flex">
      <div className={`card bg-base-100 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 border-2 ${colorClasses[color]} h-full w-full flex flex-col`}>
        <div className="card-body p-8 flex flex-col flex-1">
          {/* Stage Number */}
          <div className={`w-16 h-16 rounded-full ${colorClasses[color]} flex items-center justify-center mb-6 mx-auto border-2`}>
            <span className="text-2xl font-bold">{number}</span>
          </div>

          {/* Icon */}
          <div className={`w-20 h-20 rounded-xl ${colorClasses[color]} flex items-center justify-center mb-6 mx-auto`}>
            <Icon className="w-10 h-10" />
          </div>

          {/* Title */}
          <h3 className="text-2xl font-bold font-display mb-3 text-center">{title}</h3>
          <p className="text-base-content/90 mb-6 text-center">{description}</p>

          {/* Features - Flex grow to fill space */}
          <ul className="space-y-3 mb-6 flex-1">
            {features.map((feature, index) => (
              <li key={index} className="flex items-start gap-2">
                <div className={`w-1.5 h-1.5 rounded-full ${colorClasses[color].split(' ')[1]} mt-2 flex-shrink-0`} />
                <span className="text-sm text-base-content/80">{feature}</span>
              </li>
            ))}
          </ul>

          {/* Result - Pushed to bottom */}
          <div className={`mt-auto pt-6 border-t ${colorClasses[color].split(' ')[2]}`}>
            <p className="text-sm font-semibold text-center">
              <span className={colorClasses[color].split(' ')[1]}>Result:</span>{' '}
              <span className="text-base-content">{result}</span>
            </p>
          </div>
        </div>
      </div>

      {/* Connector Line (not shown on last item) */}
      {!isLast && (
        <div className="hidden md:block absolute top-1/2 -right-4 w-8 h-0.5 bg-base-300 transform -translate-y-1/2 z-10">
          <div className="absolute right-0 top-1/2 transform -translate-y-1/2 w-0 h-0 border-l-4 border-l-base-300 border-t-2 border-t-transparent border-b-2 border-b-transparent" />
        </div>
      )}
    </div>
  );
}
