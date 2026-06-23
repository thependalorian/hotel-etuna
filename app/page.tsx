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
import { getHubRoomTypeCatalog, getStaticRoomTypeCatalogFallback } from '@/lib/data/room-type-catalog';
import NavigationHeader from '@/components/sections/landing/NavigationHeader';
import { LandingBookingWidget } from '@/components/sections/landing/LandingBookingWidget';
import { LandingContentDegradedBanner } from '@/components/sections/landing/LandingContentDegradedBanner';
import { EtunaListingCard, EtunaSectionHeader } from '@/components/features/marketing';
import { Button } from '@/components/ui/Button';
import { slugify } from '@/lib/utils/slugify';
import Footer from '@/components/shared/Footer';
import { Calendar, Check, MapPin, Sparkles, Star, Utensils } from 'lucide-react';
import { publicCopy } from '@/lib/copy/public';
import { restaurantHoursLabels } from '@/lib/dining/restaurant-hours';
import { formatMenuPrice } from '@/lib/dining/menu-display';
import { securityLogger } from '@/lib/utils/security-logger.client';
import { ETUNA_HERO_IMAGE, ETUNA_PROPERTY_IMAGES } from '@/lib/rooms/property-images';

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

const fallbackImage = ETUNA_HERO_IMAGE;

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
  let contentDegraded = false;

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
    contentDegraded = true;
    securityLogger.error('[LandingPage] DB content load failed, rendering safe fallback:', error);
    if (roomCatalog.length === 0) {
      roomCatalog = getStaticRoomTypeCatalogFallback();
      for (const room of roomCatalog) {
        const amount = Number(room.baseRate);
        if (!Number.isNaN(amount)) {
          rateMap.set(room.id, { amount, currency: room.currency ?? 'NAD' });
        }
      }
    }
  }
  const propertyId = hubProperty?.id ?? process.env.DEFAULT_PROPERTY_ID ?? '';

  return (
    <div className="min-h-screen bg-surface-background">
      <NavigationHeader />
      <main id="main-content">
        {contentDegraded ? <LandingContentDegradedBanner /> : null}
        <section className="relative h-[600px] md:h-[700px] flex items-center justify-center overflow-hidden">
          <div className="absolute inset-0 bg-linear-to-b from-ci-secondary-chocolate/60 via-ci-secondary-chocolate/40 to-nude-900/60 z-10" />
          <Image
            src={ETUNA_HERO_IMAGE}
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
              <h2 className="font-display text-4xl md:text-5xl font-bold text-ci-secondary-chocolate mb-6">{publicCopy.home.story.heading}</h2>
              <p className="text-lg text-ink-700 mb-8 leading-relaxed">
                {publicCopy.home.story.body}
              </p>
            </div>
          </div>
        </section>

        <section id="rooms" className="bg-white py-12 md:py-section-gap">
          <div className="etuna-container-marketing">
            <EtunaSectionHeader title={`Our rooms (${roomCatalog.length} categories)`} href="/rooms" />
            <p className="mb-8 max-w-2xl text-body text-ink-600">
              Walk through each room type in a photo tour — sign in to view rates and book.
            </p>
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
              {roomCatalog.map((room) => {
                const rate = rateMap.get(room.id);
                const fallbackAmount = room.baseRate ? Number(room.baseRate) : null;
                const amount = rate?.amount ?? (Number.isNaN(fallbackAmount) ? null : fallbackAmount);
                const currency = rate?.currency ?? room.currency ?? hubProperty?.currency ?? 'NAD';
                const roomAmenities = asStringArray(room.amenities).slice(0, 3);
                const roomImage = firstImage(room.images, fallbackImage);
                const meta = `${room.unitCount} unit${room.unitCount === 1 ? '' : 's'} · up to ${room.maxOccupancy ?? 2} guests`;
                return (
                  <EtunaListingCard
                    key={room.slug}
                    href={`/rooms/${room.slug}#tour`}
                    imageSrc={roomImage}
                    imageAlt={room.roomType}
                    title={room.roomType}
                    meta={meta}
                    price={
                      isAuthenticated
                        ? formatNightlyRate(amount, currency)
                        : publicCopy.gated.viewPrices
                    }
                    featuredLabel={room.slug === 'premiere-room' ? 'Flagship stay' : null}
                    className="w-full"
                    imageSizes="(max-width: 768px) 100vw, 33vw"
                  >
                    <ul className="mt-1 space-y-1">
                      {roomAmenities.map((amenity) => (
                        <li key={amenity} className="flex items-center gap-2 text-caption text-ink-600">
                          <Check className="h-3 w-3 text-sage" aria-hidden />
                          {amenity}
                        </li>
                      ))}
                    </ul>
                  </EtunaListingCard>
                );
              })}
            </div>
          </div>
        </section>

        <section id="dining" className="py-20 bg-nude-50">
          <div className="container mx-auto px-4">
            <div className="grid md:grid-cols-2 gap-12 items-center">
              <div>
                <h2 className="font-display text-4xl md:text-5xl font-bold text-ci-secondary-chocolate mb-6">{restaurant?.name ?? 'Etuna Restaurant'}</h2>
                <p className="text-lg text-ink-700 mb-6 leading-relaxed">
                  {restaurant?.description ?? 'Our on-site restaurant serves authentic Namibian cuisine alongside international favorites.'}
                </p>
                <ul className="space-y-3 mb-8">
                  <li className="flex items-center gap-3 text-ink-700"><div className="w-2 h-2 rounded-full bg-ci-accent-sage" />Breakfast: {formatOpeningSlot(openingHours.breakfast, restaurantHoursLabels.breakfast)}</li>
                  <li className="flex items-center gap-3 text-ink-700"><div className="w-2 h-2 rounded-full bg-ci-accent-sage" />Lunch, dinner & bar: {formatOpeningSlot(openingHours.service ?? openingHours.bar ?? openingHours.dinner, restaurantHoursLabels.lunchDinner)}</li>
                  {categoryRows.slice(0, 3).map((category) => (
                    <li key={category.id} className="text-ink-700">
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
              <div className="relative h-[400px] overflow-hidden rounded-etuna-card">
                <Image
                  src={firstImage(restaurant?.images, ETUNA_PROPERTY_IMAGES.outdoorDining)}
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
              <div className="inline-flex items-center gap-2 bg-ci-accent-sage/20 text-sage px-4 py-2 rounded-full mb-4">
                <Star className="w-5 h-5 fill-sage" />
                <span className="font-bold text-lg">{publicReviews.length ? `${ratingAvg.toFixed(1)}/5` : 'No ratings yet'}</span>
                <span className="text-sm">{publicReviews.length} approved review(s)</span>
              </div>
              <h2 className="font-display text-4xl md:text-5xl font-bold text-ci-secondary-chocolate mb-4">Guest Love</h2>
            </div>
            {publicReviews.length === 0 ? (
              <div className="rounded-etuna-card border border-nude-200 bg-white p-8 text-center text-ink-600">
                No reviews yet. Be the first to share your experience!
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {publicReviews.map((review) => {
                  const name = review.guestFirstName?.trim() || 'Anonymous';
                  const location = [review.guestCity, review.guestCountry].filter(Boolean).join(', ') || 'Namibia';
                  return (
                    <div key={review.id} className="rounded-etuna-card border border-nude-200 bg-white p-6">
                      <div className="flex gap-1 mb-4">
                        {Array.from({ length: review.rating ?? 0 }).map((_, index) => (
                          <Star key={`${review.id}-${index}`} className="w-5 h-5 fill-ci-accent-ochre text-ci-primary" />
                        ))}
                      </div>
                      <p className="text-ink-700 mb-4 italic border-l-4 border-rustic pl-3">
                        "{review.reviewText ?? 'Guest left a rating without a text comment.'}"
                      </p>
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-ci-primary rounded-full flex items-center justify-center text-ci-cream font-bold">{name[0]}</div>
                        <div>
                          <div className="font-semibold text-ci-secondary-chocolate">{name}</div>
                          <div className="text-sm text-ink-600">{location}</div>
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
            <div className="max-w-4xl mx-auto bg-linear-to-br from-ci-primary to-ci-secondary-chocolate rounded-etuna-pill p-8 md:p-12 text-ci-cream">
              <h2 className="font-display text-4xl md:text-5xl font-bold mb-6 text-center">Book Your Stay</h2>
              <p className="text-center text-white/90 mb-8 text-lg">Experience authentic Namibian hospitality at Hotel Etuna</p>
              <LandingBookingWidget propertyId={propertyId} />
            </div>
          </div>
        </section>

        <section id="partners" className="bg-nude-50 py-12 md:py-section-gap">
          <div className="etuna-container-marketing">
            <EtunaSectionHeader title={publicCopy.home.partners.heading} href="/partners" />
            <p className="mb-8 max-w-2xl text-body text-ink-600">{publicCopy.home.partners.subtitle}</p>
            <div className="grid max-w-4xl grid-cols-1 gap-6 md:grid-cols-2 mx-auto">
              {partners.length === 0 ? (
                <div className="md:col-span-2 rounded-etuna-card border border-nude-200 bg-white p-8 text-center text-ink-600">
                  {contentDegraded
                    ? 'Partner listings are temporarily unavailable. Please try again shortly.'
                    : 'No partner properties to show right now.'}
                </div>
              ) : (
              partners.map((partner) => (
                <EtunaListingCard
                  key={partner.propertyId}
                  href={`/partners/${partner.propertySlug}`}
                  imageSrc={firstImage(partner.images, fallbackImage)}
                  imageAlt={partner.propertyName ?? 'Partner property'}
                  title={partner.propertyName ?? 'Partner property'}
                  meta={partner.description ?? `${partner.tenantName} partner accommodation.`}
                  className="w-full"
                  imageSizes="(max-width: 768px) 100vw, 50vw"
                >
                  <p className="flex items-center gap-2 text-caption font-semibold text-ci-accent-ochre">
                    <MapPin className="h-4 w-4" aria-hidden />
                    {[partner.city, partner.country].filter(Boolean).join(', ') || 'Namibia'}
                  </p>
                </EtunaListingCard>
              ))
              )}
            </div>
          </div>
        </section>

      </main>
      <Footer />
    </div>
  );
}
