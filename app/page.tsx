/**
 * Hotel Etuna Landing Page
 *
 * Purpose: Public homepage powered by live DB content.
 * Location: /app/page.tsx
 *
 * Manual test plan:
 * 1) Edit room name/rate in admin -> reload `/` -> verify room card updates.
 * 2) Toggle `is_public` in `/crm/reviews` -> reload `/` -> review appears/disappears.
 * 3) Edit restaurant/menu -> reload `/` -> dining text/items update.
 * 4) Edit partner property -> reload `/` -> partner cards update.
 * 5) Edit property contact/check-in/out -> reload `/` -> footer details update.
 */

import { Metadata } from 'next';
import { formatCurrencyNAD } from '@/lib/formatters';
import Image from 'next/image';
import Link from 'next/link';
import { getServerSession } from 'next-auth';
import { and, asc, desc, eq, inArray } from 'drizzle-orm';
import { authOptions } from '@/lib/auth/config';
import {
  db,
  cmsMenuItems,
  guestReviews,
  guests,
  menuCategories,
  properties,
  restaurants,
  roomRates,
  rooms,
  tenants,
} from '@/lib/db';
import { resolvePublicHubProperty } from '@/lib/utils/public-property';
import { getHubRoomTypeCatalog } from '@/lib/data/room-type-catalog';
import NavigationHeader from '@/components/sections/landing/NavigationHeader';
import { LandingBookingWidget } from '@/components/sections/landing/LandingBookingWidget';
import { Button } from '@/components/ui/Button';
import { slugify } from '@/lib/utils/slugify';
import Footer from '@/components/shared/Footer';
import { Calendar, Check, MapPin, Sparkles, Star, Utensils } from 'lucide-react';
import { publicCopy } from '@/lib/copy/public';
import { restaurantHoursLabels } from '@/lib/dining/restaurant-hours';
import { formatMenuPrice } from '@/lib/dining/menu-display';
import { securityLogger } from '@/lib/utils/security-logger.client';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: publicCopy.home.meta.title,
  description: publicCopy.home.meta.description,
};

type OpeningHours = {
  breakfast?: string | { open?: string; close?: string };
  service?: string | { open?: string; close?: string };
  bar?: string | { open?: string; close?: string };
  lunch?: string | { open?: string; close?: string };
  dinner?: string | { open?: string; close?: string };
};

const fallbackImage = '/images/hospitality/hero_hotel_lobby.jpeg';

function asStringArray(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.filter((entry): entry is string => typeof entry === 'string' && entry.trim().length > 0);
  }
  if (typeof value === 'string' && value.trim().length > 0) {
    return [value.trim()];
  }
  return [];
}

function firstImage(value: unknown, fallback: string): string {
  const images = asStringArray(value);
  const first = images[0];
  if (!first) return fallback;

  // Accept absolute URLs and root-relative public paths only.
  if (first.startsWith('/')) return first;
  if (/^https?:\/\//i.test(first)) return first;
  return fallback;
}

function formatNightlyRate(amount: number | null, currency: string): string {
  if (amount === null || Number.isNaN(amount)) return 'Price on request';
  if (currency === 'NAD') return `From ${formatCurrencyNAD(amount)}/night`;
  return `From ${currency} ${amount.toLocaleString('en-NA')}/night`;
}

function formatOpeningSlot(
  slot: string | { open?: string; close?: string } | undefined,
  fallback: string
): string {
  if (!slot) return fallback;
  if (typeof slot === 'string') return slot;
  const open = slot.open?.trim();
  const close = slot.close?.trim();
  if (open && close) return `${open} - ${close}`;
  return fallback;
}

export default async function LandingPage() {
  const session = await getServerSession(authOptions);
  const isAuthenticated = Boolean(session?.user);
  let hubTenant: { id: string; name: string | null } | null = null;
  let hubProperty: typeof properties.$inferSelect | null = null;
  let roomCatalog: Awaited<ReturnType<typeof getHubRoomTypeCatalog>> = [];
  const rateMap = new Map<string, { amount: number; currency: string }>();
  let restaurant: typeof restaurants.$inferSelect | null = null;
  let categoryRows: Array<{ id: string; name: string; displayOrder: number | null }> = [];
  let menuByCategory = new Map<string, Array<{
    id: string;
    categoryId: string | null;
    name: string;
    price: string | null;
    currency: string | null;
    createdAt: Date | null;
  }>>();
  let publicReviews: Array<{
    id: string;
    rating: number | null;
    reviewText: string | null;
    createdAt: Date | null;
    guestFirstName: string | null;
    guestCity: string | null;
    guestCountry: string | null;
  }> = [];
  let ratingAvg = 0;
  let partners: Array<{
    tenantId: string;
    tenantName: string | null;
    propertyId: string | null;
    propertyName: string | null;
    propertySlug: string | null;
    description: string | null;
    city: string | null;
    country: string | null;
    images: unknown;
  }> = [];
  let openingHours: OpeningHours = {};

  try {
    const resolved = await resolvePublicHubProperty();
    hubTenant = resolved.hubTenant;
    hubProperty = resolved.property;
    const hubTenantId = hubTenant.id;
    const propertyId = hubProperty.id;

    roomCatalog = await getHubRoomTypeCatalog();

    const roomIds = roomCatalog.map((room) => room.id);
    const defaultRoomRates = roomIds.length
      ? await db
          .select({
            roomId: roomRates.roomId,
            amount: roomRates.rateAmount,
            currency: roomRates.currency,
          })
          .from(roomRates)
          .where(and(inArray(roomRates.roomId, roomIds), eq(roomRates.isDefault, true)))
      : [];

    for (const rate of defaultRoomRates) {
      const amount = Number(rate.amount);
      if (!rate.roomId || Number.isNaN(amount)) continue;
      rateMap.set(rate.roomId, { amount, currency: rate.currency ?? 'NAD' });
    }

    [restaurant] = await db
      .select()
      .from(restaurants)
      .where(eq(restaurants.propertyId, propertyId))
      .limit(1);

    categoryRows = restaurant
      ? await db
          .select({ id: menuCategories.id, name: menuCategories.name, displayOrder: menuCategories.displayOrder })
          .from(menuCategories)
          .where(eq(menuCategories.restaurantId, restaurant.id))
          .orderBy(asc(menuCategories.displayOrder), asc(menuCategories.name))
      : [];

    const categoryIds = categoryRows.map((category) => category.id);
    const menuRows = categoryIds.length
      ? await db
          .select({
            id: cmsMenuItems.id,
            categoryId: cmsMenuItems.categoryId,
            name: cmsMenuItems.name,
            price: cmsMenuItems.price,
            currency: cmsMenuItems.currency,
            createdAt: cmsMenuItems.createdAt,
          })
          .from(cmsMenuItems)
          .where(
            and(
              inArray(cmsMenuItems.categoryId, categoryIds),
              eq(cmsMenuItems.isAvailable, true),
            ),
          )
          .orderBy(asc(cmsMenuItems.displayOrder), desc(cmsMenuItems.createdAt))
      : [];

    menuByCategory = new Map<string, typeof menuRows>();
    for (const item of menuRows) {
      const key = item.categoryId ?? '';
      if (!menuByCategory.has(key)) menuByCategory.set(key, []);
      menuByCategory.get(key)?.push(item);
    }

    publicReviews = await db
      .select({
        id: guestReviews.id,
        rating: guestReviews.rating,
        reviewText: guestReviews.reviewText,
        createdAt: guestReviews.createdAt,
        guestFirstName: guests.firstName,
        guestCity: guests.city,
        guestCountry: guests.country,
      })
      .from(guestReviews)
      .leftJoin(guests, eq(guestReviews.guestId, guests.id))
      .where(and(eq(guestReviews.tenantId, hubTenantId), eq(guestReviews.isPublic, true)))
      .orderBy(desc(guestReviews.createdAt))
      .limit(6);

    ratingAvg = publicReviews.length
      ? publicReviews.reduce((sum, review) => sum + (review.rating ?? 0), 0) / publicReviews.length
      : 0;

    const partnerRows = await db
      .select({
        tenantId: tenants.id,
        tenantName: tenants.name,
        propertyId: properties.id,
        propertyName: properties.name,
        propertySlug: properties.slug,
        description: properties.description,
        city: properties.city,
        country: properties.country,
        images: properties.images,
      })
      .from(tenants)
      .leftJoin(properties, eq(properties.tenantId, tenants.id))
      .where(and(eq(tenants.type, 'partner'), eq(tenants.status, 'active')))
      .orderBy(asc(tenants.name));

    partners = partnerRows.filter((partner) => partner.propertyId).slice(0, 3);
    openingHours = (restaurant?.openingHours as OpeningHours | null) ?? {};
  } catch (error) {
    securityLogger.error('[LandingPage] DB content load failed, rendering safe fallback:', error);
  }
  const propertyId = hubProperty?.id ?? process.env.DEFAULT_PROPERTY_ID ?? '';

  return (
    <div className="min-h-screen bg-surface-background">
      <NavigationHeader />
      <main>
        <section className="relative h-[600px] md:h-[700px] flex items-center justify-center overflow-hidden">
          <div className="absolute inset-0 bg-linear-to-b from-terracotta-900/60 via-terracotta-900/40 to-nude-900/60 z-10" />
          <Image
            src="/images/hospitality/hero_hotel_lobby.jpeg"
            alt="Hotel Etuna lobby — Ongwediva, Namibia"
            fill
            priority
            className="object-cover object-center"
            sizes="100vw"
          />
          <div className="relative z-20 container mx-auto px-4 text-center text-white">
            <h1 className="font-display text-5xl md:text-7xl font-bold mb-6">{publicCopy.home.hero.title}</h1>
            <p className="text-xl md:text-2xl mb-8 max-w-2xl mx-auto opacity-95">
              {publicCopy.home.hero.subtitle.replace('Hotel Etuna', hubTenant?.name ?? 'Hotel Etuna')}
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button asChild size="xl">
                <Link href="#booking">
                  <Calendar className="w-5 h-5" />
                  {publicCopy.ctas.bookStay}
                </Link>
              </Button>
              <Button asChild size="xl" variant="outline" className="border-white text-white hover:bg-white/20">
                <Link href="#story">
                  <Sparkles className="w-5 h-5" />
                  {publicCopy.ctas.explore}
                </Link>
              </Button>
            </div>
          </div>
        </section>

        <section id="story" className="py-20 bg-nude-50">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto text-center">
              <h2 className="font-display text-4xl md:text-5xl font-bold text-terracotta-900 mb-6">{publicCopy.home.story.heading}</h2>
              <p className="text-lg text-terracotta-800 mb-8 leading-relaxed">
                {publicCopy.home.story.body}
              </p>
            </div>
          </div>
        </section>

        <section id="rooms" className="py-20 bg-white">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="font-display text-4xl md:text-5xl font-bold text-terracotta-900 mb-4">
                Our Rooms ({roomCatalog.length} categories)
              </h2>
              <p className="text-lg text-terracotta-800 max-w-2xl mx-auto">
                Walk through each room type in a photo tour — sign in to view rates and book.
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {roomCatalog.map((room) => {
                const rate = rateMap.get(room.id);
                const fallbackAmount = room.baseRate ? Number(room.baseRate) : null;
                const amount = rate?.amount ?? (Number.isNaN(fallbackAmount) ? null : fallbackAmount);
                const currency = rate?.currency ?? room.currency ?? hubProperty?.currency ?? 'NAD';
                const roomAmenities = asStringArray(room.amenities).slice(0, 5);
                const roomImage = firstImage(room.images, fallbackImage);
                return (
                  <Link
                    key={room.slug}
                    href={`/rooms/${room.slug}#tour`}
                    className="group bg-white rounded-2xl overflow-hidden shadow-card hover:shadow-card-hover transition-all duration-300 hover:-translate-y-1"
                  >
                    <div className="aspect-4/3 relative bg-nude-200">
                      <Image src={roomImage} alt={room.roomType} fill className="object-cover" />
                    </div>
                    <div className="p-6">
                      <h3 className="font-display text-2xl font-bold text-terracotta-900 mb-2">{room.roomType}</h3>
                      {isAuthenticated ? (
                        <p className="text-khaki-600 font-semibold mb-1">{formatNightlyRate(amount, currency)}</p>
                      ) : (
                        <p className="text-khaki-600 font-semibold mb-1">{publicCopy.gated.viewPrices}</p>
                      )}
                      <p className="text-sm text-terracotta-800 mb-4">
                        {room.unitCount} unit{room.unitCount === 1 ? '' : 's'} · up to {room.maxOccupancy ?? 2} guests
                      </p>
                      <ul className="space-y-2 mb-4">
                        {roomAmenities.map((amenity) => (
                          <li key={amenity} className="flex items-center gap-2 text-sm text-terracotta-800">
                            <Check className="w-4 h-4 text-sage" />
                            {amenity}
                          </li>
                        ))}
                      </ul>
                      <div className="text-khaki-600 font-semibold group-hover:text-khaki-700 flex items-center gap-2">
                        {publicCopy.ctas.takeTheTour}
                        <span className="group-hover:translate-x-1 transition-transform">→</span>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        </section>

        <section id="dining" className="py-20 bg-nude-50">
          <div className="container mx-auto px-4">
            <div className="grid md:grid-cols-2 gap-12 items-center">
              <div>
                <h2 className="font-display text-4xl md:text-5xl font-bold text-terracotta-900 mb-6">{restaurant?.name ?? 'Etuna Restaurant'}</h2>
                <p className="text-lg text-terracotta-800 mb-6 leading-relaxed">
                  {restaurant?.description ?? 'Our on-site restaurant serves authentic Namibian cuisine alongside international favorites.'}
                </p>
                <ul className="space-y-3 mb-8">
                  <li className="flex items-center gap-3 text-terracotta-800"><div className="w-2 h-2 rounded-full bg-sage" />Breakfast: {formatOpeningSlot(openingHours.breakfast, restaurantHoursLabels.breakfast)}</li>
                  <li className="flex items-center gap-3 text-terracotta-800"><div className="w-2 h-2 rounded-full bg-sage" />Lunch, dinner & bar: {formatOpeningSlot(openingHours.service ?? openingHours.bar ?? openingHours.dinner, restaurantHoursLabels.lunchDinner)}</li>
                  {categoryRows.slice(0, 3).map((category) => (
                    <li key={category.id} className="text-terracotta-800">
                      <div className="font-semibold">{category.name}</div>
                      <div className="text-sm">
                        {(menuByCategory.get(category.id) ?? []).slice(0, 2).map((item) => {
                          const price = Number(item.price);
                          return `${item.name} (${formatMenuPrice(price, item.currency ?? 'NAD')})`;
                        }).join(' • ') || 'No items yet'}
                      </div>
                    </li>
                  ))}
                </ul>
                <Button asChild size="lg">
                  <Link href="/dining#menu">
                    <Utensils className="w-5 h-5" />
                    View full menu & prices
                  </Link>
                </Button>
              </div>
              <div className="relative h-[400px] rounded-2xl overflow-hidden shadow-card">
                <Image
                  src={firstImage(restaurant?.images, '/images/hospitality/restaurant_dining.jpeg')}
                  alt={restaurant?.name ?? 'Etuna Restaurant'}
                  fill
                  className="object-cover"
                />
              </div>
            </div>
          </div>
        </section>


        <section className="py-20 bg-nude-50">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <div className="inline-flex items-center gap-2 bg-sage/20 text-sage px-4 py-2 rounded-full mb-4">
                <Star className="w-5 h-5 fill-sage" />
                <span className="font-bold text-lg">{publicReviews.length ? `${ratingAvg.toFixed(1)}/5` : 'No ratings yet'}</span>
                <span className="text-sm">{publicReviews.length} approved review(s)</span>
              </div>
              <h2 className="font-display text-4xl md:text-5xl font-bold text-terracotta-900 mb-4">Guest Love</h2>
            </div>
            {publicReviews.length === 0 ? (
              <div className="bg-white rounded-2xl p-8 shadow-card text-center text-terracotta-800">
                No reviews yet. Be the first to share your experience!
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {publicReviews.map((review) => {
                  const name = review.guestFirstName?.trim() || 'Anonymous';
                  const location = [review.guestCity, review.guestCountry].filter(Boolean).join(', ') || 'Namibia';
                  return (
                    <div key={review.id} className="bg-white rounded-2xl p-6 shadow-card">
                      <div className="flex gap-1 mb-4">
                        {Array.from({ length: review.rating ?? 0 }).map((_, index) => (
                          <Star key={`${review.id}-${index}`} className="w-5 h-5 fill-khaki-600 text-khaki-600" />
                        ))}
                      </div>
                      <p className="text-terracotta-800 mb-4 italic border-l-4 border-rustic pl-3">
                        "{review.reviewText ?? 'Guest left a rating without a text comment.'}"
                      </p>
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-khaki-600 rounded-full flex items-center justify-center text-white font-bold">{name[0]}</div>
                        <div>
                          <div className="font-semibold text-terracotta-900">{name}</div>
                          <div className="text-sm text-terracotta-800">{location}</div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </section>

        <section id="booking" className="py-20 bg-white">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto bg-linear-to-br from-khaki-600 to-terracotta-800 rounded-3xl p-8 md:p-12 text-white">
              <h2 className="font-display text-4xl md:text-5xl font-bold mb-6 text-center">Book Your Stay</h2>
              <p className="text-center text-white/90 mb-8 text-lg">Experience authentic Namibian hospitality at Hotel Etuna</p>
              <LandingBookingWidget propertyId={propertyId} />
            </div>
          </div>
        </section>

        <section id="partners" className="py-20 bg-nude-50">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="font-display text-4xl md:text-5xl font-bold text-terracotta-900 mb-4">
                {publicCopy.home.partners.heading}
              </h2>
              <p className="text-lg text-terracotta-800 max-w-2xl mx-auto">{publicCopy.home.partners.subtitle}</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
              {partners.map((partner) => (
                <Link key={partner.propertyId} href={`/partners/${partner.propertySlug}`} className="group bg-white rounded-2xl overflow-hidden shadow-card hover:shadow-card-hover transition-all duration-300">
                  <div className="aspect-video relative bg-nude-200">
                    <Image
                      src={firstImage(partner.images, fallbackImage)}
                      alt={partner.propertyName ?? 'Partner property'}
                      fill
                      className="object-cover"
                    />
                  </div>
                  <div className="p-6">
                    <h3 className="font-display text-2xl font-bold text-terracotta-900 mb-2">{partner.propertyName}</h3>
                    <p className="text-terracotta-800 mb-3">{partner.description ?? `${partner.tenantName} partner accommodation.`}</p>
                    <div className="flex items-center gap-2 text-sm text-khaki-600 font-semibold">
                      <MapPin className="w-4 h-4" />
                      {[partner.city, partner.country].filter(Boolean).join(', ') || 'Namibia'}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>

      </main>
      <Footer />
    </div>
  );
}
