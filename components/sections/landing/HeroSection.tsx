/**
 * Hero Section Component
 *
 * Purpose: Landing page hero section with background image, headline, and CTAs
 * Location: /components/sections/landing/HeroSection.tsx
 */

import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { ImagePlaceholder } from '@/components/ui';
import { ArrowRight, CheckCircle2 } from 'lucide-react';
import { brand } from '@/lib/copy/brand';
import { publicCopy } from '@/lib/copy/public';

export default function HeroSection() {
  return (
    <section className="relative min-h-[90vh] flex items-center overflow-hidden">
      <div className="absolute inset-0 z-0 w-full h-full min-h-[90vh]">
        <ImagePlaceholder
          src="/images/hospitality/hero_hotel_lobby.jpeg"
          alt="Hotel Etuna lobby and reception"
          fill
          className="object-cover"
          priority
          quality={75}
          sizes="100vw"
        />
        <div className="absolute inset-0 bg-gradient-to-br from-terracotta-900/80 via-terracotta-900/70 to-nude-900/60" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-32 w-full">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <HeroContent />
          <HeroImage />
        </div>
      </div>
    </section>
  );
}

function HeroContent() {
  return (
    <div className="text-white">
      <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold font-display mb-6 text-balance leading-tight">
        {publicCopy.home.hero.title}
      </h1>

      <p className="text-xl md:text-2xl mb-4 text-white/95 font-medium leading-relaxed">
        {publicCopy.home.hero.subtitle}
      </p>

      <p className="text-lg mb-8 text-white/90 max-w-xl">{brand.leadLine}</p>

      <div className="flex flex-wrap gap-4 mb-8">
        <Link href="/#booking">
          <Button variant="primary" size="lg" className="min-h-[44px] px-8 text-lg">
            {publicCopy.ctas.bookStay}
            <ArrowRight className="w-5 h-5" />
          </Button>
        </Link>
        <Link href="/rooms">
          <Button
            variant="outline"
            size="lg"
            className="min-h-[44px] px-8 text-lg border-2 border-white/90 text-white hover:bg-white/20 hover:border-white"
          >
            {publicCopy.ctas.explore}
          </Button>
        </Link>
      </div>

      <div className="flex flex-wrap items-center gap-6 text-sm text-white/95">
        {publicCopy.trustIndicators.map((text) => (
          <TrustIndicator key={text} icon={CheckCircle2} text={text} />
        ))}
      </div>
    </div>
  );
}

function HeroImage() {
  return (
    <div className="relative hidden lg:block">
      <div className="relative w-full aspect-[4/3] rounded-2xl overflow-hidden shadow-2xl border-4 border-white/20">
        <ImagePlaceholder
          src="/images/hospitality/hero_hotel_lobby.jpeg"
          alt="Hotel Etuna — rooms and pool"
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

function TrustIndicator({
  icon: Icon,
  text,
}: {
  icon: React.ComponentType<{ className?: string }>;
  text: string;
}) {
  return (
    <span className="flex items-center gap-2">
      <Icon className="w-4 h-4 text-khaki-sand" />
      {text}
    </span>
  );
}
