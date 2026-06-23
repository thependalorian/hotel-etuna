/**
 * Quick Actions Component
 *
 * Purpose: Quick action buttons for common tasks at Hotel Etuna.
 * Location: /components/features/QuickActions.tsx
 */

import Link from 'next/link';
import { Calendar, Utensils, FileText } from 'lucide-react';

const actions = [
  { href: '/bookings/new', icon: Calendar, label: 'New Booking', emphasis: true as const },
  { href: '/restaurant/menu', icon: Utensils, label: 'Manage Menu', emphasis: false as const },
  { href: '/cms/pages', icon: FileText, label: 'Manage Content', emphasis: false as const },
  { href: '/properties', icon: Calendar, label: 'Property Details', emphasis: false as const },
];

export default function QuickActions() {
  return (
    <div className="dashboard-card p-6 animate-slide-up">
      <h2 className="font-display text-xl font-bold text-ink-900 mb-1">Quick actions</h2>
      <p className="mb-4 text-sm text-ink-600">
        Common tasks for your property.
      </p>
      <div className="grid grid-cols-1 gap-3">
        {actions.map((action) => {
          const Icon = action.icon;
          return (
            <Link 
              key={action.href}
              href={action.href} 
              className={
                action.emphasis
                  ? 'inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full bg-ci-primary text-ci-cream font-bold hover:bg-ci-primary/90 transition-colors min-h-[44px]'
                  : 'inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full border border-nude-200 text-ink-800 font-medium hover:bg-nude-50 transition-colors min-h-[44px]'
              }
              aria-label={action.label}
            >
              <Icon className="w-4 h-4" />
              {action.label}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
