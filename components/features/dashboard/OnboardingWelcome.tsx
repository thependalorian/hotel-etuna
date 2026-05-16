/**
 * Onboarding Welcome Component
 * 
 * Purpose: Welcome screen for new users without properties
 * Location: /components/features/OnboardingWelcome.tsx
 * 
 * Features:
 * - Welcome message
 * - Quick setup steps
 * - Welcome messaging
 * 
 * Design System:
 * - Uses semantic tokens: text-primary-content, bg-base-100
 * - Gradient backgrounds
 * 
 * Accessibility:
 * - Proper heading hierarchy (h1, h2, h3)
 * 
 * @module OnboardingWelcome
 */

import Link from 'next/link';
import { Building, ArrowRight } from 'lucide-react';

export default function OnboardingWelcome() {
  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-nude-600 via-nude-500 to-nude-400 text-white rounded-2xl p-8 shadow-xl">
        <div className="flex items-center gap-3 mb-4">
          <span className="text-3xl font-bold">H</span>
          <h1 className="text-4xl font-bold">
            Welcome to Hotel Etuna!
          </h1>
        </div>
        <p className="text-xl opacity-95 mb-6">
          Align your property operations in 60 seconds and deliver premium guest experiences from day one.
        </p>
      </div>

      <div className="card bg-base-100 shadow-xl border-2 border-primary">
        <div className="card-body">
          <h2 className="card-title text-2xl mb-6">Quick Setup</h2>
          <div className="space-y-6">
            <div className="flex items-start gap-4 p-4 bg-base-200 rounded-lg hover:bg-base-300 transition-colors">
              <div className="w-12 h-12 rounded-full bg-primary text-primary-content flex items-center justify-center font-bold text-xl flex-shrink-0">
                1
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-lg mb-2">Add Your First Property</h3>
                <p className="text-base-content/70 mb-4">
                  Add your hotel details so your team can manage rooms, reservations, and service standards in one place.
                </p>
                <Link href="/properties/new" className="btn btn-primary min-h-[44px]">
                  <Building className="w-4 h-4 mr-2" />
                  Create Property
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Link>
              </div>
            </div>

            <div className="flex items-start gap-4 p-4 bg-base-200 rounded-lg opacity-60">
              <div className="w-12 h-12 rounded-full bg-base-300 text-base-content flex items-center justify-center font-bold text-xl flex-shrink-0">
                2
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-lg mb-2">Configure Your Services</h3>
                <p className="text-base-content/70">
                  Configure room tiers, dining services, and operational settings for smooth front desk and back-office workflows.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4 p-4 bg-base-200 rounded-lg opacity-60">
              <div className="w-12 h-12 rounded-full bg-base-300 text-base-content flex items-center justify-center font-bold text-xl flex-shrink-0">
                3
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-lg mb-2">Start Managing</h3>
                <p className="text-base-content/70">
                  Coordinate bookings, guest requests, and team tasks while Sofia supports your hospitality staff.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="card bg-gradient-to-br from-success/10 to-info/10 border border-success/20">
        <div className="card-body">
          <h3 className="card-title text-success mb-2">Get Started</h3>
          <p className="text-base-content/80">
            Built for hotel operators who value excellence, reliability, and guest-first service.
            Set up your operations and start delivering premium stays today.
          </p>
        </div>
      </div>
    </div>
  );
}
