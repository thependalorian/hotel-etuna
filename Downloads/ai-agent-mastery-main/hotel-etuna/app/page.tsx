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
import Image from 'next/image';
import Link from 'next/link';
import { and, asc, desc, eq, inArray } from 'drizzle-orm';
import { getServerSession } from 'next-auth';
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
import { authOptions } from '@/lib/auth/config';
import { resolvePublicHubProperty } from '@/lib/utils/public-property';
import NavigationHeader from '@/components/sections/landing/NavigationHeader';
import { LandingBookingWidget } from '@/components/sections/landing/LandingBookingWidget';
import { Button } from '@/components/ui/Button';
import { slugify } from '@/lib/utils/slugify';
import Footer from '@/components/shared/Footer';
import { Calendar, Check, Compass, MapPin, Sparkles, Star, Utensils } from 'lucide-react';

export const revalidate = 300;

export const metadata: Metadata = {
  title: 'Hotel Etuna - He Takes Care of Us',
  description: 'Welcome to Hotel Etuna in Ongwediva, Namibia. Experience authentic Namibian hospitality.',
};

type OpeningHours = {
  breakfast?: string;
  lunch?: string;
  dinner?: string;
};

const fallbackImage = '/images/hospitality/hero_hotel_lobby.jpeg';

function formatCurrency(amount: number | null, currency: string): string {
  if (amount === null || Number.isNaN(amount)) return 'Price on request';
  return `From ${currency} ${amount.toLocaleString()}/night`;
}

export default async function LandingPage() {
  const session = await getServerSession(authOptions);
  const isAuthenticated = Boolean(session?.user);
  const { hubTenant, property: hubProperty } = await resolvePublicHubProperty();
  const hubTenantId = hubTenant.id;
  const propertyId = hubProperty.id;

  const roomRows = await db
    .select({
      id: rooms.id,
      roomType: rooms.roomType,
      maxOccupancy: rooms.maxOccupancy,
      baseRate: rooms.baseRate,
      currency: rooms.currency,
      amenities: rooms.amenities,
      images: rooms.images,
    })
    .from(rooms)
    .where(eq(rooms.propertyId, propertyId))
    .orderBy(asc(rooms.roomType));

  const roomIds = roomRows.map((room) => room.id);
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

  const rateMap = new Map<string, { amount: number; currency: string }>();
  for (const rate of defaultRoomRates) {
    const amount = Number(rate.amount);
    if (!rate.roomId || Number.isNaN(amount)) continue;
    rateMap.set(rate.roomId, { amount, currency: rate.currency ?? 'NAD' });
  }

  const [restaurant] = await db
    .select()
    .from(restaurants)
    .where(eq(restaurants.propertyId, propertyId))
    .limit(1);

  const categoryRows = restaurant
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
        .where(inArray(cmsMenuItems.categoryId, categoryIds))
        .orderBy(asc(cmsMenuItems.displayOrder), desc(cmsMenuItems.createdAt))
    : [];

  const menuByCategory = new Map<string, typeof menuRows>();
  for (const item of menuRows) {
    const key = item.categoryId ?? '';
    if (!menuByCategory.has(key)) menuByCategory.set(key, []);
    menuByCategory.get(key)?.push(item);
  }

  const publicReviews = await db
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

  const ratingAvg = publicReviews.length
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

  const partners = partnerRows.filter((partner) => partner.propertyId).slice(0, 3);
  const openingHours = (restaurant?.openingHours as OpeningHours | null) ?? {};

  return (
    <div className="min-h-screen bg-surface-background">
      <NavigationHeader />
      <main>
        <section className="relative h-[600px] md:h-[700px] flex items-center justify-center overflow-hidden">
          <div className="absolute inset-0 bg-linear-to-b from-terracotta-900/60 via-terracotta-900/40 to-nude-900/60 z-10" />
          <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: "url('/images/hospitality/hero_hotel_lobby.jpeg')" }} />
          <div className="relative z-20 container mx-auto px-4 text-center text-white">
            <h1 className="font-display text-5xl md:text-7xl font-bold mb-6">He Takes Care of Us</h1>
            <p className="text-xl md:text-2xl mb-8 max-w-2xl mx-auto opacity-95">
              Welcome to {hubTenant?.name ?? 'Hotel Etuna'} - your home in the heart of Ongwediva
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button asChild size="xl" className="bg-khaki-600 hover:bg-rustic">
                <Link href="#booking">
                  <Calendar className="w-5 h-5" />
                  Book Your Stay
                </Link>
              </Button>
              <Button asChild size="xl" variant="outline" className="border-white text-white hover:bg-white/20">
                <Link href="#story">
                  <Sparkles className="w-5 h-5" />
                  Explore
                </Link>
              </Button>
            </div>
          </div>
        </section>

        <section id="story" className="py-20 bg-nude-50">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto text-center">
              <h2 className="font-display text-4xl md:text-5xl font-bold text-terracotta-900 mb-6">More than a hotel - a Namibian welcome</h2>
              <p className="text-lg text-terracotta-800 mb-8 leading-relaxed">
                <span className="font-display text-2xl text-khaki-600">"Etuna"</span> means <span className="font-semibold">"He takes care of us"</span> in Oshiwambo.
                We currently offer {roomRows.length} room types, a refreshing pool, authentic on-site restaurant, and curated tours.
              </p>
            </div>
          </div>
        </section>

        <section id="rooms" className="py-20 bg-white">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="font-display text-4xl md:text-5xl font-bold text-terracotta-900 mb-4">Our Rooms ({roomRows.length})</h2>
              <p className="text-lg text-terracotta-800 max-w-2xl mx-auto">Live availability-linked room data from our booking system.</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {roomRows.map((room) => {
                const rate = rateMap.get(room.id);
                const fallbackAmount = room.baseRate ? Number(room.baseRate) : null;
                const amount = rate?.amount ?? (Number.isNaN(fallbackAmount) ? null : fallbackAmount);
                const currency = rate?.currency ?? room.currency ?? hubProperty?.currency ?? 'NAD';
                return (
                  <Link
                    key={room.id}
                    href={`/rooms/${slugify(room.roomType)}`}
                    className="group bg-white rounded-2xl overflow-hidden shadow-card hover:shadow-card-hover transition-all duration-300 hover:-translate-y-1"
                  >
                    <div className="aspect-4/3 relative bg-nude-200">
                      <Image src={room.images?.[0] ?? fallbackImage} alt={room.roomType} fill className="object-cover" />
                    </div>
                    <div className="p-6">
                      <h3 className="font-display text-2xl font-bold text-terracotta-900 mb-2">{room.roomType}</h3>
                      {isAuthenticated ? (
                        <p className="text-khaki-600 font-semibold mb-1">{formatCurrency(amount, currency)}</p>
                      ) : (
                        <p className="text-khaki-600 font-semibold mb-1">Sign in to view prices</p>
                      )}
                      <p className="text-sm text-terracotta-800 mb-4">Up to {room.maxOccupancy ?? 2} guests</p>
                      <ul className="space-y-2 mb-4">
                        {(room.amenities ?? []).slice(0, 5).map((amenity) => (
                          <li key={amenity} className="flex items-center gap-2 text-sm text-terracotta-800">
                            <Check className="w-4 h-4 text-sage" />
                            {amenity}
                          </li>
                        ))}
                      </ul>
                      <div className="text-khaki-600 font-semibold group-hover:text-khaki-700 flex items-center gap-2">
                        {isAuthenticated ? 'View Details' : 'Sign up to see prices'}
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
                  <li className="flex items-center gap-3 text-terracotta-800"><div className="w-2 h-2 rounded-full bg-sage" />Breakfast: {openingHours.breakfast ?? '06:30 - 10:00'}</li>
                  <li className="flex items-center gap-3 text-terracotta-800"><div className="w-2 h-2 rounded-full bg-sage" />Dinner: {openingHours.dinner ?? '18:00 - 22:00'}</li>
                  {categoryRows.slice(0, 2).map((category) => (
                    <li key={category.id} className="text-terracotta-800">
                      <div className="font-semibold">{category.name}</div>
                      <div className="text-sm">
                        {(menuByCategory.get(category.id) ?? []).slice(0, 2).map((item) => {
                          const price = Number(item.price);
                          const label = Number.isNaN(price) ? 'Price on request' : `${item.currency ?? 'NAD'} ${price.toLocaleString()}`;
                          return isAuthenticated ? `${item.name} (${label})` : item.name;
                        }).join(' • ') || 'No items yet'}
                      </div>
                    </li>
                  ))}
                </ul>
                <Button asChild size="lg">
                  <Link href={isAuthenticated ? '/dining' : '/login?redirect=/dining'}>
                    <Utensils className="w-5 h-5" />
                    {isAuthenticated ? 'View Full Menu' : 'Sign in to order online'}
                  </Link>
                </Button>
              </div>
              <div className="relative h-[400px] rounded-2xl overflow-hidden shadow-card">
                <Image src={restaurant?.images?.[0] ?? '/images/hospitality/restaurant_dining.jpeg'} alt={restaurant?.name ?? 'Etuna Restaurant'} fill className="object-cover" />
              </div>
            </div>
          </div>
        </section>

        <section id="tours" className="py-20 bg-white">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="font-display text-4xl md:text-5xl font-bold text-terracotta-900 mb-4">Explore Ongwediva & Beyond</h2>
              <p className="text-lg text-terracotta-800 max-w-2xl mx-auto">Discover the cultural richness and natural beauty of Northern Namibia with our curated tours.</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {[
                { name: 'Cultural Heritage Tour', description: 'Visit traditional villages and meet local artisans.', icon: Compass, duration: 'Half Day' },
                { name: 'Nature & Wildlife', description: 'Explore nearby reserves and scenic landscapes.', icon: Sparkles, duration: 'Full Day' },
                { name: 'City & Market Tour', description: 'Experience Ongwediva markets and city highlights.', icon: MapPin, duration: '3-4 Hours' },
              ].map((tour) => (
                <div key={tour.name} className="bg-nude-50 rounded-2xl p-8 hover:shadow-card transition-shadow">
                  <div className="w-12 h-12 bg-sage/20 rounded-full flex items-center justify-center mb-4"><tour.icon className="w-6 h-6 text-sage" /></div>
                  <h3 className="font-display text-2xl font-bold text-terracotta-900 mb-3">{tour.name}</h3>
                  <p className="text-terracotta-800 mb-4">{tour.description}</p>
                  <div className="text-sm text-khaki-600 font-semibold">{tour.duration}</div>
                </div>
              ))}
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
              <h2 className="font-display text-4xl md:text-5xl font-bold text-terracotta-900 mb-4">More Lodging in Windhoek Area</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
              {partners.map((partner) => (
                <Link key={partner.propertyId} href={`/partners/${partner.propertySlug}`} className="group bg-white rounded-2xl overflow-hidden shadow-card hover:shadow-card-hover transition-all duration-300">
                  <div className="aspect-video relative bg-nude-200">
                    <Image src={partner.images?.[0] ?? fallbackImage} alt={partner.propertyName ?? 'Partner property'} fill className="object-cover" />
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
