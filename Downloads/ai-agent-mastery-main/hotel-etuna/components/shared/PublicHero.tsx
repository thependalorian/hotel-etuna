import Link from 'next/link';

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
  backgroundImage = '/images/hospitality/hero_hotel_lobby.jpeg',
  breadcrumbLabel,
}: PublicHeroProps) {
  return (
    <section className="relative h-80 md:h-[380px] flex items-center overflow-hidden">
      <div className="absolute inset-0 bg-linear-to-b from-terracotta-900/65 to-rustic/70 z-10" />
      <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url('${backgroundImage}')` }} />
      <div className="relative z-20 container mx-auto px-4 text-white">
        <div className="mb-4 text-sm">
          <Link href="/" className="hover:text-khaki-200 transition-colors">
            Home
          </Link>{' '}
          <span className="text-white/80">&gt;</span>{' '}
          <span className="text-khaki-100">{breadcrumbLabel}</span>
        </div>
        <h1 className="font-display text-4xl md:text-5xl font-bold mb-3">{title}</h1>
        {subtitle ? <p className="text-lg md:text-xl max-w-3xl text-white/95">{subtitle}</p> : null}
      </div>
    </section>
  );
}
