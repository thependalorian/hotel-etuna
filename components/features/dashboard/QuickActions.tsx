/**
 * Quick Actions Component
 * 
 * Purpose: Display quick action buttons for common tasks
 * Location: /components/features/QuickActions.tsx
 * 
 * Features:
 * - Grid of action buttons
 * - Links to common pages
 * - Icons for each action
 * 
 * Design System:
 * - Uses semantic tokens: text-base-content, bg-base-100
 * - Button size: min-h-[44px] (Fitt's Law)
 * 
 * Accessibility:
 * - Semantic HTML structure
 * - Proper heading hierarchy (h2)
 * - ARIA labels for links
 * 
 * @module QuickActions
 */

import Link from 'next/link';
import { Building, Calendar, Utensils, Users, FileText } from 'lucide-react';

const actions = [
  { href: '/properties/new', icon: Building, label: 'Add Property', emphasis: false as const },
  { href: '/bookings/new', icon: Calendar, label: 'New Booking', emphasis: true as const },
  { href: '/restaurant/menu', icon: Utensils, label: 'Manage Menu', emphasis: false as const },
  { href: '/staff/new', icon: Users, label: 'Add Staff', emphasis: false as const },
  { href: '/cms', icon: FileText, label: 'Manage Content', emphasis: false as const },
];

export default function QuickActions() {
  return (
    <div className="card bg-base-100 shadow-lg card-hover animate-slide-up">
      <div className="card-body">
        <h2 className="card-title mb-1 text-xl font-display">Quick actions</h2>
        <p className="mb-4 text-sm text-base-content/60">
          Primary path highlighted for faster booking entry.
        </p>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {actions.map((action) => {
            const Icon = action.icon;
            return (
              <Link 
                key={action.href}
                href={action.href} 
                className={
                  action.emphasis
                    ? 'btn btn-primary gentle-lift min-h-[44px] shadow-md'
                    : 'btn btn-primary btn-outline gentle-lift min-h-[44px]'
                }
                aria-label={action.label}
              >
                <Icon className="mr-2 h-4 w-4" />
                {action.label}
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
