/**
 * Onboarding Welcome Component
 * 
 * Purpose: Welcome screen for Hotel Etuna staff (single-property OS).
 * Location: /components/features/OnboardingWelcome.tsx
 */

import Link from 'next/link';
import { Building, ArrowRight } from 'lucide-react';

export default function OnboardingWelcome() {
  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-nude-600 via-nude-500 to-nude-400 text-white rounded-etuna-card p-8">
        <div className="flex items-center gap-3 mb-4">
          <span className="text-3xl font-bold">H</span>
          <h1 className="text-4xl font-bold">
            Welcome to Hotel Etuna!
          </h1>
        </div>
        <p className="text-xl opacity-95 mb-6">
          Everything you need to run your property — bookings, restaurant, housekeeping, and payments.
        </p>
      </div>

      <div className="rounded-etuna-card border border-nude-200 bg-surface-elevated">
        <div className="p-6">
          <h2 className="font-display text-2xl font-bold text-ink-900 mb-6">Quick Setup</h2>
          <div className="space-y-6">
            <div className="flex items-start gap-4 p-4 bg-nude-50 rounded-etuna-input">
              <div className="w-12 h-12 rounded-full bg-ci-primary text-ci-cream flex items-center justify-center font-bold text-xl flex-shrink-0">
                1
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-lg text-ink-900 mb-2">Set Up Your Property</h3>
                <p className="text-ink-700 mb-4">
                  Add your hotel details so your team can manage rooms, reservations, and service standards.
                </p>
                <Link href="/properties/new" className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-ci-primary text-ci-cream font-bold hover:bg-ci-primary/90 transition-colors min-h-[44px]">
                  <Building className="w-4 h-4" />
                  Get Started
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>

            <div className="flex items-start gap-4 p-4 bg-nude-50 rounded-etuna-input opacity-60">
              <div className="w-12 h-12 rounded-full bg-nude-300 text-ink-800 flex items-center justify-center font-bold text-xl flex-shrink-0">
                2
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-lg text-ink-900 mb-2">Configure Services</h3>
                <p className="text-ink-700">
                  Set room tiers, dining menus, and operational settings for smooth front desk workflows.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4 p-4 bg-nude-50 rounded-etuna-input opacity-60">
              <div className="w-12 h-12 rounded-full bg-nude-300 text-ink-800 flex items-center justify-center font-bold text-xl flex-shrink-0">
                3
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-lg text-ink-900 mb-2">Start Managing</h3>
                <p className="text-ink-700">
                  Coordinate bookings, guest requests, and team tasks. Sofia AI is ready to support your staff.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-etuna-card border border-nude-200 bg-nude-50 p-6">
        <h3 className="font-display text-lg font-bold text-ink-900 mb-2">Hotel Etuna Operating System</h3>
        <p className="text-ink-700">
          Built for one property: 35 rooms, Etuna Restaurant, conference hall, and campsite.
          Everything your team needs to deliver premium guest experiences.
        </p>
      </div>
    </div>
  );
}
