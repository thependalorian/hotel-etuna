/**
 * Hero Section Component
 * 
 * Purpose: Landing page hero section with background image, headline, and CTAs
 * Location: /components/sections/landing/HeroSection.tsx
 * 
 * Features:
 * - Full-width background image with gradient overlay
 * - Responsive headline and subheadline
 * - Primary and secondary CTAs
 * - Trust indicators (no credit card, setup time, etc.)
 * - Dashboard mockup image on desktop
 * - Sofia AI badge overlay
 * 
 * Design System:
 * - Uses semantic tokens: text-surface-elevated, bg-surface-elevated
 * - Gradient overlays: from-nude-600/90 via-nude-600/80 to-nude-500/90
 * - Button sizes: min-h-[56px] for primary CTAs
 * - Responsive: Mobile-first design with lg: breakpoints
 * 
 * Accessibility:
 * - Proper heading hierarchy (h1)
 * - Alt text for images
 * - Keyboard navigation for CTAs
 * - ARIA labels for interactive elements
 * 
 * @module HeroSection
 */

import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { ImagePlaceholder } from '@/components/ui';
import { ArrowRight, CheckCircle2 } from 'lucide-react';

export default function HeroSection() {
  return (
    <section className="relative min-h-[90vh] flex items-center overflow-hidden">
      {/* Background Image with Overlay */}
      <div className="absolute inset-0 z-0 w-full h-full min-h-[90vh]">
        <ImagePlaceholder
          src="/images/hospitality/hero_hotel_lobby.jpeg"
          alt="Modern hotel lobby and reception - Buffr Host property management system"
          fill
          className="object-cover"
          priority
          quality={75}
          sizes="100vw"
        />
        <div className="absolute inset-0 bg-gradient-to-br from-nude-600/90 via-nude-600/80 to-nude-500/90"></div>
      </div>

      {/* Content */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-32 w-full">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Left: Text Content */}
          <HeroContent />
          
          {/* Right: Dashboard Mockup */}
          <HeroImage />
        </div>
      </div>
    </section>
  );
}

function HeroContent() {
  return (
    <div className="text-surface-elevated animate-in fade-in slide-in-from-left-8 duration-700">
      <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold font-display mb-6 text-balance leading-tight text-surface-elevated animate-in fade-in slide-in-from-bottom-4 duration-1000 delay-100">
        Turn Missed Inquiries Into Direct Bookings
      </h1>
      
      <p className="text-xl md:text-2xl mb-4 text-white font-medium leading-relaxed animate-in fade-in slide-in-from-bottom-4 duration-1000 delay-200">
        AI-powered hospitality platform that answers guest inquiries 24/7 and manages your entire operation—from reservations to revenue.
      </p>
      
      <div className="flex flex-wrap gap-4 mb-8 animate-in fade-in slide-in-from-bottom-4 duration-1000 delay-300">
        <Link href="/register">
          <Button 
            variant="default"
            size="lg"
            className="min-h-[56px] px-8 text-lg font-semibold bg-white/90 backdrop-blur-sm border-2 border-white text-nude-800 hover:bg-white transition-all duration-200 hover:scale-105 hover:shadow-xl"
          >
            Get Started Free
            <ArrowRight className="w-5 h-5 ml-2 transition-transform duration-200 group-hover:translate-x-1" />
          </Button>
        </Link>
        <Link href="#platform-overview">
          <Button 
            variant="outline"
            size="lg"
            className="min-h-[56px] px-8 text-lg font-semibold border-2 border-white/90 text-white hover:bg-white/20 hover:border-white transition-all duration-200 hover:scale-105"
          >
            See How It Works
          </Button>
        </Link>
      </div>
      
      <div className="flex flex-wrap items-center gap-6 text-sm text-white animate-in fade-in slide-in-from-bottom-4 duration-1000 delay-400">
        <TrustIndicator icon={CheckCircle2} text="No credit card required" />
        <TrustIndicator icon={CheckCircle2} text="Setup in 5 minutes" />
        <TrustIndicator icon={CheckCircle2} text="Enterprise-grade security" />
      </div>
    </div>
  );
}

function HeroImage() {
  return (
    <div className="relative hidden lg:block animate-in fade-in slide-in-from-right-8 duration-1000 delay-200">
      <div className="relative w-full aspect-[4/3] rounded-2xl overflow-hidden shadow-2xl border-4 border-surface-elevated/20 transition-transform duration-300 hover:scale-105">
        <ImagePlaceholder
          src="/images/hospitality/hero_hotel_lobby.jpeg"
          alt="Modern hotel lobby and reception - Buffr Host property management system"
          fill
          className="object-cover"
          quality={75}
          sizes="(max-width: 1024px) 0vw, 50vw"
          aspectRatio="4/3"
        />
      </div>
    </div>
  );
}

function TrustIndicator({ icon: Icon, text }: { icon: React.ComponentType<{ className?: string }>, text: string }) {
  return (
    <span className="flex items-center gap-2">
      <Icon className="w-4 h-4 text-white" />
      {text}
    </span>
  );
}

