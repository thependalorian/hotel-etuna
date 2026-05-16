/**
 * About Section Component
 * 
 * Purpose: Landing page about section with image and text content
 * Location: /components/sections/landing/AboutSection.tsx
 * 
 * Features:
 * - Image left, text right layout (responsive: stacks on mobile)
 * - Decorative background element
 * - Call-to-action button
 * 
 * Design System:
 * - Uses semantic tokens: text-base-content, bg-base-100
 * - Button size: min-h-[48px]
 * - Responsive grid: lg:grid-cols-2
 * 
 * Accessibility:
 * - Proper heading hierarchy (h2)
 * - Alt text for images
 * - Keyboard navigation for CTA
 * 
 * @module AboutSection
 */

import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { ImagePlaceholder } from '@/components/ui';
import { ArrowRight } from 'lucide-react';
import { brand } from '@/lib/copy/brand';
import { publicCopy } from '@/lib/copy/public';

export default function AboutSection() {
  return (
    <section className="py-20 md:py-32 bg-base-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Left: Image */}
          <div className="relative order-2 lg:order-1">
            <div className="relative w-full aspect-[4/3] rounded-2xl overflow-hidden shadow-xl">
              <ImagePlaceholder
                src="/images/hospitality/restaurant_dining.jpeg"
                alt="Hospitality in Namibia"
                fill
                className="object-cover"
                quality={75}
                sizes="(max-width: 1024px) 100vw, 50vw"
                aspectRatio="4/3"
              />
            </div>
            {/* Decorative Element */}
            <div className="absolute -bottom-6 -right-6 w-32 h-32 bg-primary/20 rounded-full blur-3xl -z-10"></div>
          </div>

          {/* Right: Text Content */}
          <div className="order-1 lg:order-2">
            <h2 className="text-4xl md:text-5xl font-bold font-display mb-6 text-balance text-terracotta-900">
              {publicCopy.home.story.heading}
            </h2>
            <p className="text-xl text-terracotta-800 mb-6 leading-relaxed">{publicCopy.home.story.body}</p>
            <p className="text-terracotta-800 mb-8 leading-relaxed">{brand.meaning}</p>
            <Link href="/#booking">
              <Button variant="primary" size="lg" className="min-h-[44px]">
                {publicCopy.ctas.bookStay}
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
