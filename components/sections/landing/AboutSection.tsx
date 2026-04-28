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
            <h2 className="text-4xl md:text-5xl font-bold font-display mb-6 text-balance">
              We Help Hospitality Businesses Turn Missed Opportunities Into Revenue
            </h2>
            <p className="text-xl text-base-content/90 mb-6 leading-relaxed">
              Every missed call, unanswered email, or delayed response is a booking walking out your door. While competitors respond instantly, you're losing revenue to faster, more responsive businesses.
            </p>
            <p className="text-base-content/80 mb-6 leading-relaxed">
              Hotel Etuna changes that. Our AI-powered platform ensures no inquiry goes unanswered—whether it's a phone call at midnight, an email on weekends, or a chat during peak hours. Sofia AI handles all inquiries 24/7 through chat, email, and phone. She captures guest email addresses when needed, sends quotations and confirmations automatically, and property owners are CC'd on all email communications for complete transparency. Everything converts into bookings and manages your entire operation in one unified platform.
            </p>
            <p className="text-base-content/80 mb-8 leading-relaxed">
              Unlike phone-only solutions or expensive enterprise systems, Hotel Etuna provides everything you need—complete PMS, AI concierge, restaurant management, and business intelligence—in one integrated system. Get started with no credit card required.
            </p>
            <Link href="/register">
              <Button variant="outline" size="lg" className="min-h-[48px]">
                Get Started
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
