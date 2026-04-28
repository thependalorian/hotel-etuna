/**
 * Pricing Section Component
 * 
 * Purpose: Landing page section displaying transparent pricing with free and premium features
 * Location: /components/sections/landing/PricingSection.tsx
 * 
 * Features:
 * - Two-column layout: Free Forever plan and Premium Add-Ons
 * - Clear separation of free vs premium features
 * - Primary CTA button for free plan
 * - Contact CTA for premium information
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

const freeFeatures = [
  'Property & room management',
  'Booking & reservation system',
  'Basic Sofia AI (chat/email)',
  'Content management system',
  'Basic analytics dashboard',
  'Guest relationship management',
  'Staff management',
  'Menu & restaurant management',
];

const premiumFeatures = [
  'Payment processing',
  'Advanced business intelligence',
  'Marketing automation',
  'Loyalty & rewards programs',
  'Advanced automations',
  'Voice AI & WhatsApp integration',
  'Channel manager integrations',
  'Enterprise features',
  'White-label solutions',
  'Dedicated account management',
];

export default function PricingSection() {
  return (
    <section className="py-20 md:py-32 bg-gradient-to-br from-nude-600/10 via-base-100 to-nude-500/10">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-4xl md:text-5xl font-bold font-display mb-6 text-balance">
            Simple, Transparent Pricing
          </h2>
          <p className="text-xl text-base-content/90 max-w-2xl mx-auto">
            Get started with our complete platform—no credit card required. Core features included. Premium add-ons available when you need advanced capabilities.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Free Plan */}
          <div className="card bg-base-100 shadow-2xl border-2 border-primary/20">
            <div className="card-body p-8 text-center">
              <div className="mb-6">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-nude-600 to-nude-500 mb-4 shadow-lg">
                  <span className="text-3xl font-bold text-white">H</span>
                </div>
                <h3 className="text-3xl font-bold font-display mb-3">Free Forever</h3>
                <div className="text-4xl font-bold text-primary mb-1">N$0</div>
                <p className="text-base-content/80 text-sm">per month, forever</p>
              </div>

              <div className="space-y-3 mb-6 text-left">
                <p className="text-sm font-semibold text-base-content mb-3 text-center">Included Free:</p>
                {freeFeatures.map((feature, index) => (
                  <div key={index} className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-success flex-shrink-0 mt-0.5" />
                    <span className="text-sm text-base-content/80">{feature}</span>
                  </div>
                ))}
              </div>

              <div className="pt-6 border-t border-base-300">
                <Link href="/register">
                  <Button 
                    variant="primary" 
                    size="lg"
                    className="min-h-[56px] px-8 text-lg font-bold shadow-nude-primary hover:shadow-nude-strong w-full"
                  >
                    Get Started Free
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </Button>
                </Link>
                <p className="text-xs text-base-content/80 mt-3">
                  No credit card required • Start immediately
                </p>
              </div>
            </div>
          </div>

          {/* Premium Add-Ons */}
          <div className="card bg-base-100 shadow-xl border-2 border-base-300">
            <div className="card-body p-8">
              <div className="mb-6 text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-nude-500 to-nude-600 mb-4 shadow-lg">
                  <Sparkles className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-3xl font-bold font-display mb-2">Premium Add-Ons</h3>
                <p className="text-base-content/90 text-sm">Available when you need them</p>
              </div>

              <div className="space-y-3 mb-6 text-left">
                <p className="text-sm font-semibold text-base-content mb-3 text-center">Coming Soon:</p>
                {premiumFeatures.map((feature, index) => (
                  <div key={index} className="flex items-start gap-2">
                    <Sparkles className="w-4 h-4 text-nude-500 flex-shrink-0 mt-0.5" />
                    <span className="text-sm text-base-content/90">{feature}</span>
                  </div>
                ))}
              </div>

              <div className="pt-6 border-t border-base-300 text-center">
                <p className="text-sm text-base-content/80 mb-4">
                  Premium features will be available as optional add-ons. Core platform remains free forever.
                </p>
                <Link href="/register">
                  <Button 
                    variant="outline" 
                    size="lg"
                    className="min-h-[56px] px-8 text-lg font-semibold w-full"
                  >
                    Get Started
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
