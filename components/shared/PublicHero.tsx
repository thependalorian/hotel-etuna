import Link from 'next/link';

import { ETUNA_HERO_IMAGE } from '@/lib/rooms/property-images';

type PublicHeroProps = {
  title: string;
  subtitle?: string;
  backgroundImage?: string;
  breadcrumbLabel: string;
};

/**
 * PublicHero
 *
 * Purpose: Shared hero across public pages with consistent breadcrumb + height.
 * Location: /components/shared/PublicHero.tsx
 */
export default function PublicHero({
  title,
  subtitle,
  backgroundImage = ETUNA_HERO_IMAGE,
  breadcrumbLabel,
}: PublicHeroProps) {
  return (
    <section className="relative h-80 md:h-[380px] flex items-center overflow-hidden">
      <div className="absolute inset-0 bg-linear-to-b from-ci-primary/70 to-ci-secondary-chocolate/80 z-10" />
      <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url('${backgroundImage}')` }} />
      <div className="relative z-20 container mx-auto px-4 text-white">
        <div className="mb-4 text-sm">
          <Link href="/" className="hover:text-ci-cream transition-colors">
            Home
          </Link>{' '}
          <span className="text-white/80">&gt;</span>{' '}
          <span className="text-ci-cream">{breadcrumbLabel}</span>
        </div>
        <h1 className="font-display text-4xl md:text-5xl font-bold mb-3">{title}</h1>
        {subtitle ? <p className="text-lg md:text-xl max-w-3xl text-white/95">{subtitle}</p> : null}
      </div>
    </section>
  );
}
