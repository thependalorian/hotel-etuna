/**
 * Final CTA Section Component
 * 
 * Purpose: Landing page final call-to-action section
 * Location: /components/sections/landing/FinalCTA.tsx
 * 
 * Features:
 * - Gradient background
 * - Large headline and description
 * - Primary and secondary CTAs
 * - Centered layout
 * 
 * Design System:
 * - Uses semantic tokens: text-primary-content, bg-gradient
 * - Button sizes: min-h-[64px] for primary CTA
 * - Gradient: from-nude-600 via-nude-500 to-nude-400
 * 
 * Accessibility:
 * - Proper heading hierarchy (h2)
 * - Semantic section element
 * - Keyboard navigation for CTAs
 * 
 * @module FinalCTA
 */

import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { ArrowRight } from 'lucide-react';

export default function FinalCTA() {
  return (
    <section className="py-20 md:py-32 bg-gradient-to-r from-nude-600 via-nude-500 to-nude-400 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold font-display mb-6 text-balance">
          Start Managing Your Property Today
        </h2>
        <p className="text-xl md:text-2xl mb-10 opacity-95 leading-relaxed max-w-2xl mx-auto">
          Join hospitality businesses using Hotel Etuna to turn missed opportunities into direct bookings. Get started in minutes.
        </p>
        <div className="flex justify-center gap-4 flex-wrap">
          <Link href="/register">
            <Button 
              variant="default"
              size="xl"
              className="min-h-[64px] px-10 text-xl font-bold bg-base-100 text-primary hover:bg-base-200 shadow-2xl border-2 border-base-100/20"
            >
              Get Started Free
              <ArrowRight className="w-6 h-6 ml-3" />
            </Button>
          </Link>
          <Link href="#platform-overview">
            <Button 
              variant="outline"
              size="xl"
              className="min-h-[64px] px-10 text-xl font-bold border-2 border-base-100/50 text-base-100 hover:bg-base-100/10"
            >
              Learn More
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
}
