/**
 * Pricing Section Component
 * 
 * Purpose: Landing page section displaying room tiers and direct booking options
 * Location: /components/sections/landing/PricingSection.tsx
 * 
 * Features:
 * - Premium room tiers from N$850
 * - Fair package highlights
 * - Direct booking call-to-action
 * 
 * Design System:
 * - Uses semantic tokens: text-base-content, bg-base-100
 * - Gradient background: from-nude-600/10 via-base-100 to-nude-500/10
 * - Button sizes: min-h-[56px] for CTAs
 * 
 * Accessibility:
 * - Proper heading hierarchy (h2, h3)
 * - Semantic section element
 * - Keyboard navigation for CTAs
 * 
 * @module PricingSection
 */

import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { ArrowRight, CheckCircle2, Sparkles } from 'lucide-react';

const roomTiers = [
  'Standard - from N$850/night',
  'Luxury - enhanced comfort and design',
  'Family - spacious layout for group stays',
  'Executive Suite - premium business and leisure comfort',
  'Premier - signature top-tier experience',
];

const packageHighlights = [
  'Seasonal fair packages',
  'Breakfast-inclusive options',
  'Airport shuttle available on request (paid)',
  'Support for business and family travel',
  'Direct booking assistance from our team',
];

export default function PricingSection() {
  return (
    <section className="py-20 md:py-32 bg-gradient-to-br from-nude-600/10 via-base-100 to-nude-500/10">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-4xl md:text-5xl font-bold font-display mb-6 text-balance">
            Stay With Us
          </h2>
          <p className="text-xl text-base-content/90 max-w-2xl mx-auto">
            Discover premium accommodation at Hotel Etuna in Ongwediva, with room tiers from N$850 and fair,
            flexible packages for every stay.
          </p>
        </div>

        <div className="card bg-base-100 shadow-2xl border-2 border-primary/20 max-w-4xl mx-auto">
          <div className="card-body p-8 md:p-10">
            <div className="mb-8 text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-nude-600 to-nude-500 mb-4 shadow-lg">
                <Sparkles className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-3xl font-bold font-display mb-3">Premium Room Tiers</h3>
              <p className="text-base-content/80">Rates start from N$850 per night (subject to season and availability).</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
              <div className="space-y-3">
                <p className="text-sm font-semibold text-base-content">Room Options</p>
                {roomTiers.map((tier, index) => (
                  <div key={index} className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-success flex-shrink-0 mt-0.5" />
                    <span className="text-sm text-base-content/90">{tier}</span>
                  </div>
                ))}
              </div>

              <div className="space-y-3">
                <p className="text-sm font-semibold text-base-content">Fair Packages</p>
                {packageHighlights.map((item, index) => (
                  <div key={index} className="flex items-start gap-2">
                    <Sparkles className="w-4 h-4 text-nude-500 flex-shrink-0 mt-0.5" />
                    <span className="text-sm text-base-content/90">{item}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-6 border-t border-base-300 text-center">
              <Link href="/contact">
                <Button
                  variant="primary"
                  size="lg"
                  className="min-h-[56px] px-8 text-lg font-bold shadow-nude-primary hover:shadow-nude-strong"
                >
                  Book Directly
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
              </Link>
              <p className="text-xs text-base-content/80 mt-3">
                Prefer assistance? Contact our team for tailored stay recommendations.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
