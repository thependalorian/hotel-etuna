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
  'Standard (Type A) — N$800/night · double bed',
  'Standard (Type B) — N$800/night · two single beds',
  'Standard (Type C) — N$1,200/night · double + single (3 guests)',
  'Executive Room — N$1,000/night',
  'Premiere Room — N$2,000/night',
];

const facilityOffers = [
  { label: 'Conference Hall — N$1,200 per session (08:00–17:00)', href: '/facilities/conference' },
  { label: 'Campsite — from N$1,200 whole-site (per-person rates apply)', href: '/facilities/campsite' },
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
            Discover premium accommodation at Hotel Etuna in Ongwediva — five room categories from N$800,
            plus conference and campsite bookings online.
          </p>
        </div>

        <div className="card bg-base-100 shadow-2xl border-2 border-primary/20 max-w-4xl mx-auto">
          <div className="card-body p-8 md:p-10">
            <div className="mb-8 text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-nude-600 to-nude-500 mb-4 shadow-lg">
                <Sparkles className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-3xl font-bold font-display mb-3">Premium Room Tiers</h3>
              <p className="text-base-content/80">Guest rooms from N$800 per night (35 units across 5 categories).</p>
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

            <div className="mb-6 space-y-2">
              <p className="text-sm font-semibold text-base-content">Facilities</p>
              {facilityOffers.map((offer) => (
                <Link
                  key={offer.href}
                  href={offer.href}
                  className="flex items-center justify-between gap-2 rounded-xl border border-base-300 px-4 py-3 text-sm hover:bg-base-200 transition-colors"
                >
                  <span>{offer.label}</span>
                  <ArrowRight className="w-4 h-4 shrink-0" />
                </Link>
              ))}
            </div>

            <div className="pt-6 border-t border-base-300 text-center flex flex-wrap gap-3 justify-center">
              <Link href="/rooms">
                <Button
                  variant="primary"
                  size="lg"
                  className="min-h-[56px] px-8 text-lg font-bold shadow-nude-primary hover:shadow-nude-strong rounded-full"
                >
                  View rooms
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
              </Link>
              <Link href="/contact">
                <Button variant="outline" size="lg" className="min-h-[56px] px-8 rounded-full">
                  Contact us
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
