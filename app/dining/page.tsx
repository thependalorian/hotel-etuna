/**
 * Dining & Restaurant Page
 *
 * Purpose: Showcase Hotel Etuna's restaurant, menu, and dining experience
 * Location: app/dining/page.tsx
 */

import { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/Button';
import { Utensils, Clock, Leaf } from 'lucide-react';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { getCompleteMenu } from '@/lib/data/dining';
import { serializePublicMenu } from '@/lib/dining/serialize-public-menu';
import { resolvePublicHubProperty } from '@/lib/utils/public-property';
import { getCachedPopularMenuItemIds } from '@/lib/services/menu/MenuPopularityService';
import PublicHero from '@/components/shared/PublicHero';
import Footer from '@/components/shared/Footer';
import NavigationHeader from '@/components/sections/landing/NavigationHeader';
import { publicCopy } from '@/lib/copy/public';
import { ETUNA_PROPERTY_IMAGES } from '@/lib/rooms/property-images';
import { GuestFavouritesStrip } from '@/components/dining/GuestFavouritesStrip';
import { PublicMenuItem, PublicMenuPayload } from '@/lib/dining/menu-display';
import { MenuDisplay } from '@/components/dining/MenuDisplay';

export const metadata: Metadata = {
  title: 'Dining & Restaurant',
  description:
    'Experience authentic Namibian cuisine at Hotel Etuna. Full menu with NAD pricing, traditional specialties, and international favourites.',
};

export default async function DiningPage() {
  const session = await getServerSession(authOptions);
  const isAuthenticated = Boolean(session?.user);

  const { hubTenant, property } = await resolvePublicHubProperty();
  const { restaurant, categories: categoryRows, itemsByCategory } = await getCompleteMenu();
  const featuredMenuItemIds = await getCachedPopularMenuItemIds(
    hubTenant.id,
    property.id,
    restaurant?.id ?? undefined,
  );
  const publicMenu = serializePublicMenu(categoryRows, itemsByCategory, {
    featuredMenuItemIds,
  });

  // Prepare menu data for client-side rendering
  // Guest favourites will be fetched client-side in GuestFavouritesStrip
  const menuData = {
    ...publicMenu,
    featuredMenuItemIds,
    restaurantName: restaurant?.name || 'Etuna Restaurant',
  };

  return (
    <div className="min-h-screen bg-surface-background">
      <NavigationHeader />

      <main>
        <PublicHero
          title="A Taste of Namibia"
          subtitle="Browse our full menu with prices in N$. Traditional flavours, grilled mains, pizzas, and a curated bar list."
          backgroundImage={ETUNA_PROPERTY_IMAGES.outdoorDining}
          breadcrumbLabel="Dining"
        />

        <section className="py-12 bg-white sm:py-16">
          <div className="container mx-auto px-4 sm:px-6">
            <div className="max-w-4xl mx-auto text-center">
              <h2 className="font-display text-3xl font-bold text-ci-secondary-chocolate mb-6 sm:text-4xl md:text-5xl">
                {restaurant?.name ?? 'Our Restaurant'}
              </h2>
              <p className="text-lg text-ink-700 leading-relaxed mb-8">
                {restaurant?.description ??
                  "At Hotel Etuna, dining is more than just a meal—it's an experience that celebrates Namibian culture and hospitality."}
              </p>
              <div className="grid md:grid-cols-3 gap-6 mt-12">
                <div className="bg-nude-50 rounded-etuna-card p-6">
                  <div className="w-12 h-12 bg-ci-accent-sage/20 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Leaf className="w-6 h-6 text-sage" />
                  </div>
                  <h3 className="font-semibold text-ci-secondary-chocolate mb-2">Fresh & Local</h3>
                  <p className="text-sm text-ink-600">Ingredients sourced from local suppliers</p>
                </div>
                <div className="bg-nude-50 rounded-etuna-card p-6">
                  <div className="w-12 h-12 bg-ci-accent-sage/20 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Utensils className="w-6 h-6 text-sage" />
                  </div>
                  <h3 className="font-semibold text-ci-secondary-chocolate mb-2">Expert Chefs</h3>
                  <p className="text-sm text-ink-600">Experienced culinary team with passion</p>
                </div>
                <div className="bg-nude-50 rounded-etuna-card p-6">
                  <div className="w-12 h-12 bg-ci-accent-sage/20 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Clock className="w-6 h-6 text-sage" />
                  </div>
                  <h3 className="font-semibold text-ci-secondary-chocolate mb-2">Clear Hours</h3>
                  <p className="text-sm text-ink-600">
                    Breakfast {publicCopy.dining.hours.breakfast}. Lunch, dinner & bar{' '}
                    {publicCopy.dining.hours.lunchDinner}.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {isAuthenticated && (
          <GuestFavouritesStrip />
        )}

        <section className="py-16 bg-nude-50" id="menu">
          <div className="container mx-auto px-4 sm:px-6">
            <div className="max-w-6xl mx-auto">
              <div className="mb-12 text-center">
                <h2 className="font-display text-3xl font-bold text-ci-secondary-chocolate mb-4 sm:text-4xl">Our Menu</h2>
                <p className="mx-auto max-w-2xl text-lg text-ink-700">
                  Browse our full menu one page at a time — use Previous and Next below the book. Tap any dish for full
                  details. All prices are in Namibian Dollars (N$) and match our live kitchen menu.
                </p>
              </div>

              <MenuDisplay menu={menuData} />
            </div>
          </div>
        </section>

        <section className="py-12 bg-white sm:py-16">
          <div className="container mx-auto px-4 sm:px-6">
            <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-12 items-center">
              <div>
                <h2 className="font-display text-3xl font-bold text-ci-secondary-chocolate mb-6 sm:text-4xl">Dining Experience</h2>
                <div className="space-y-6">
                  <div>
                    <h3 className="font-semibold text-lg text-ci-secondary-chocolate mb-2">Indoor Dining</h3>
                    <p className="text-ink-700">
                      Our air-conditioned restaurant seats up to 60 guests in a comfortable, elegant setting with
                      authentic Namibian decor.
                    </p>
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg text-ci-secondary-chocolate mb-2">Outdoor Terrace</h3>
                    <p className="text-ink-700">
                      Enjoy your meal under the African sky on our covered terrace, perfect for breakfast or evening
                      dining with views of our gardens.
                    </p>
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg text-ci-secondary-chocolate mb-2">Room Service</h3>
                    <p className="text-ink-700">
                      Prefer to dine in your room? Room service for checked-in guests follows kitchen hours (
                      {publicCopy.dining.hours.lunchDinner}), with charges to your stay folio.
                    </p>
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg text-ci-secondary-chocolate mb-2">Dietary Requirements</h3>
                    <p className="text-ink-700">
                      We accommodate vegetarian, vegan, halal, and other dietary requirements. Please inform our staff
                      of any allergies or preferences.
                    </p>
                  </div>
                </div>
              </div>
              <div className="aspect-4/3 relative rounded-etuna-card overflow-hidden ">
                <Image
                  src={ETUNA_PROPERTY_IMAGES.outdoorDining}
                  alt="Dining Experience at Hotel Etuna"
                  fill
                  className="object-cover"
                />
              </div>
            </div>
          </div>
        </section>

        <section className="py-16 bg-linear-to-br from-ci-primary to-ci-accent-terracotta text-white">
          <div className="container mx-auto px-4 text-center">
            <h2 className="font-display text-4xl font-bold mb-6">Operating Hours</h2>
            <div className="max-w-3xl mx-auto grid md:grid-cols-3 gap-8 mb-8">
              <div>
                <h3 className="font-semibold text-xl mb-2">Breakfast</h3>
                <p className="text-white/90">{publicCopy.dining.hours.breakfast}</p>
                <p className="mt-2 text-sm text-white/75">Buffet and light meals</p>
              </div>
              <div>
                <h3 className="font-semibold text-xl mb-2">Lunch & Dinner</h3>
                <p className="text-white/90">{publicCopy.dining.hours.lunchDinner}</p>
                <p className="mt-2 text-sm text-white/75">Kitchen orders until close</p>
              </div>
              <div>
                <h3 className="font-semibold text-xl mb-2">Bar</h3>
                <p className="text-white/90">{publicCopy.dining.hours.bar}</p>
                <p className="mt-2 text-sm text-white/75">Drinks and wine list</p>
              </div>
            </div>
            <p className="text-white/90 mb-8">
              Reservations welcome for lunch and dinner, especially on weekends.
            </p>
            <Button asChild size="xl" className="bg-white text-ci-secondary-chocolate hover:bg-ci-primary hover:text-ci-cream">
              <Link href={isAuthenticated ? '/contact' : '/login?redirect=/dining'}>
                {isAuthenticated ? 'Make a reservation' : publicCopy.gated.orderOnline}
              </Link>
            </Button>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
