/**
 * Final CTA Section Component
 *
 * Purpose: Landing page final call-to-action section
 * Location: /components/sections/landing/FinalCTA.tsx
 */

import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { ArrowRight } from 'lucide-react';
import { brand } from '@/lib/copy/brand';
import { publicCopy } from '@/lib/copy/public';

export default function FinalCTA() {
  return (
    <section className="py-20 md:py-32 bg-linear-to-br from-terracotta-800 to-terracotta-900 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold font-display mb-6 text-balance">
          {publicCopy.home.booking.heading}
        </h2>
        <p className="text-xl md:text-2xl mb-10 text-white/95 leading-relaxed max-w-2xl mx-auto">
          {brand.leadLine}
        </p>
        <div className="flex justify-center gap-4 flex-wrap">
          <Link href="/#booking">
            <Button variant="primary" size="xl" className="min-h-[44px] px-10 text-xl">
              {publicCopy.ctas.bookStay}
              <ArrowRight className="w-6 h-6" />
            </Button>
          </Link>
          <Link href="/rooms">
            <Button
              variant="outline"
              size="xl"
              className="min-h-[44px] px-10 text-xl border-2 border-white/80 text-white hover:bg-white/20"
            >
              {publicCopy.ctas.explore}
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
}
