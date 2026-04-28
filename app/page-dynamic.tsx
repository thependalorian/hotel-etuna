/**
 * Hotel Etuna Landing Page (DATABASE-DRIVEN)
 * 
 * Purpose: Public-facing homepage with database-driven content
 * Location: app/page.tsx
 * 
 * Design: All content dynamically loaded from Neon database via Drizzle ORM
 * 
 * MANUAL TEST PLAN:
 * 1. Verify all room cards display from database with correct slugs
 * 2. Check restaurant section shows "Etuna Restaurant" with real menu items
 * 3. Confirm only approved reviews (is_public = true) appear in Guest Love section
 * 4. Validate partner cards show active partners with correct property data
 * 5. Ensure footer contact details match property table
 * 6. Test that changing room prices in admin updates landing page (after revalidation)
 * 7. Verify toggling review approval in admin makes reviews appear/disappear
 */

import { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/Button';
import { 
  Sparkles, 
  Home, 
  Utensils, 
  Compass, 
  Star,
  Check,
  MapPin,
  Phone,
  Mail,
  Calendar
} from 'lucide-react';
import { db, properties, rooms, restaurants, cmsMenuItems, menuCategories, guestReviews, guests, tenants, eq, and, desc } from '@/lib/db';

// Revalidate every 5 minutes (ISR)
export const revalidate = 300;

export const metadata: Metadata = {
  title: 'Hotel Etuna – He Takes Care of Us',
  description: 'Welcome to Hotel Etuna in Ongwediva, Namibia. Experience authentic Namibian hospitality with our rooms, on-site restaurant, pool, and curated tours.',
};

// Helper to slugify room types
function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^\w-]+/g, '');
}

export default async function LandingPage() {
  // Get environment variables
  const HUB_TENANT_ID = process.env.HUB_TENANT_ID!;
  const DEFAULT_PROPERTY_ID = process.env.DEFAULT_PROPERTY_ID!;

  // Fetch hub property data
  const property = await db.query.properties.findFirst({
    where: eq(properties.id, DEFAULT_PROPERTY_ID),
  });

  // Fetch rooms for hub property
  const propertyRooms = await db.query.rooms.findMany({
    where: eq(rooms.propertyId, DEFAULT_PROPERTY_ID),
    orderBy: [rooms.baseRate],
  });

  // Group rooms by type and get one representative room per type
  const roomsByType = propertyRooms.reduce((acc, room) => {
    if (!acc[room.roomType]) {
      acc[room.roomType] = room;
    }
    return acc;
  }, {} as Record<string, typeof propertyRooms[0]>);

  const uniqueRoomTypes = Object.values(roomsByType);

  // Fetch restaurant data
  const restaurant = await db.query.restaurants.findFirst({
    where: eq(restaurants.propertyId, DEFAULT_PROPERTY_ID),
  });

  // Fetch menu categories and items for preview
  const menuPreview: Array<{ name: string; price: string; category: string }> = [];
  if (restaurant) {
    const categories = await db.query.menuCategories.findMany({
      where: and(
        eq(menuCategories.restaurantId, restaurant.id),
        eq(menuCategories.isActive, true)
      ),
      orderBy: [menuCategories.displayOrder],
      limit: 3,
    });

    for (const category of categories) {
      const items = await db.query.cmsMenuItems.findMany({
        where: and(
          eq(cmsMenuItems.categoryId, category.id),
          eq(cmsMenuItems.isAvailable, true)
        ),
        limit: 2,
      });

      menuPreview.push(...items.map(item => ({
        name: item.name,
        price: `NAD ${Number(item.price).toFixed(2)}`,
        category: category.name,
      })));
    }
  }

  // Fetch approved guest reviews
  const reviews = await db
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
    .where(and(
      eq(guestReviews.tenantId, HUB_TENANT_ID),
      eq(guestReviews.isPublic, true)
    ))
    .orderBy(desc(guestReviews.createdAt))
    .limit(6);

  // Calculate average rating
  const avgRating = reviews.length > 0
    ? reviews.reduce((sum, r) => sum + (r.rating || 0), 0) / reviews.length
    : 0;

  // Fetch active partner properties
  const partnerTenants = await db.query.tenants.findMany({
    where: and(
      eq(tenants.type, 'partner'),
      eq(tenants.status, 'active')
    ),
    limit: 3,
  });

  const partnerProperties = await Promise.all(
    partnerTenants.map(async (tenant) => {
      const prop = await db.query.properties.findFirst({
        where: eq(properties.tenantId, tenant.id),
      });
      return prop ? { ...prop, tenantName: tenant.name } : null;
    })
  );

  const validPartners = partnerProperties.filter(Boolean);

  return (
    <div className="min-h-screen bg-surface-background">
      {/* Navigation Header */}
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-sm border-b border-nude-200">
        <nav className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-khaki-600 rounded-full flex items-center justify-center text-white font-display font-bold">
              HE
            </div>
            <div className="flex flex-col">
              <span className="font-display text-lg font-bold text-terracotta-900">Hotel Etuna</span>
              <span className="text-xs text-terracotta-800">Ongwediva, Namibia</span>
            </div>
          </div>
          
          <div className="hidden md:flex items-center gap-6">
            <Link href="#rooms" className="text-terracotta-800 hover:text-khaki-600 transition-colors font-medium">
              Rooms
            </Link>
            <Link href="#dining" className="text-terracotta-800 hover:text-khaki-600 transition-colors font-medium">
              Dining
            </Link>
            <Link href="#tours" className="text-terracotta-800 hover:text-khaki-600 transition-colors font-medium">
              Tours
            </Link>
            <Link href="#about" className="text-terracotta-800 hover:text-khaki-600 transition-colors font-medium">
              About
            </Link>
            <Link href="#contact" className="text-terracotta-800 hover:text-khaki-600 transition-colors font-medium">
              Contact
            </Link>
          </div>
          
          <div className="flex items-center gap-3">
            <Button asChild variant="outline" size="sm" className="hidden md:inline-flex">
              <Link href="/login">Sign In</Link>
            </Button>
            <Button asChild size="sm">
              <Link href="#booking">Book Now</Link>
            </Button>
          </div>
        </nav>
      </header>

      <main>
        {/* Hero Section */}
        <section className="relative h-[600px] md:h-[700px] flex items-center justify-center overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-terracotta-900/60 via-terracotta-900/40 to-nude-900/60 z-10" />
          <div 
            className="absolute inset-0 bg-cover bg-center"
            style={{
              backgroundImage: "url('/images/hospitality/hero_hotel_lobby.jpeg')",
            }}
          />
          
          <div className="relative z-20 container mx-auto px-4 text-center text-white">
            <h1 className="font-display text-5xl md:text-7xl font-bold mb-6 animate-fade-in">
              He Takes Care of Us
            </h1>
            <p className="text-xl md:text-2xl mb-8 max-w-2xl mx-auto opacity-95 animate-slide-up">
              Welcome to Hotel Etuna – your home in the heart of Ongwediva
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center animate-slide-up">
              <Button asChild size="xl" className="bg-khaki-600 hover:bg-khaki-700">
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

        {/* The Etuna Story Section */}
        <section id="story" className="py-20 bg-nude-50">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto text-center">
              <h2 className="font-display text-4xl md:text-5xl font-bold text-terracotta-900 mb-6">
                More than a hotel – a Namibian welcome
              </h2>
              <p className="text-lg text-terracotta-800 mb-8 leading-relaxed">
                <span className="font-display text-2xl text-khaki-600">"Etuna"</span> means{' '}
                <span className="font-semibold">"He takes care of us"</span> in Oshiwambo, reflecting our
                commitment to genuine Namibian hospitality. Located minutes from the Ongwediva Trade Fair,
                we offer {uniqueRoomTypes.length} distinct room types, a refreshing pool, authentic on-site restaurant, and curated
                cultural tours that showcase the heart of Northern Namibia.
              </p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-12">
                <div className="text-center">
                  <div className="text-4xl font-display font-bold text-khaki-600 mb-2">{uniqueRoomTypes.length}</div>
                  <div className="text-sm text-terracotta-800">Room Types</div>
                </div>
                <div className="text-center">
                  <div className="text-4xl font-display font-bold text-khaki-600 mb-2">24/7</div>
                  <div className="text-sm text-terracotta-800">Service</div>
                </div>
                <div className="text-center">
                  <div className="text-4xl font-display font-bold text-khaki-600 mb-2">1</div>
                  <div className="text-sm text-terracotta-800">Pool & Restaurant</div>
                </div>
                <div className="text-center">
                  <div className="text-4xl font-display font-bold text-khaki-600 mb-2">10+</div>
                  <div className="text-sm text-terracotta-800">Tours Available</div>
                </div>
              </div>
              <Button asChild size="lg" className="mt-12">
                <Link href="/about">
                  Read Our Full Story
                </Link>
              </Button>
            </div>
          </div>
        </section>

        {/* Rooms Section */}
        <section id="rooms" className="py-20 bg-white">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="font-display text-4xl md:text-5xl font-bold text-terracotta-900 mb-4">
                Our Rooms
              </h2>
              <p className="text-lg text-terracotta-800 max-w-2xl mx-auto">
                {uniqueRoomTypes.length} distinct room types designed for comfort, each with air conditioning, mosquito nets, and authentic Namibian touches
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {uniqueRoomTypes.map((room) => {
                const slug = slugify(room.roomType);
                const displayAmenities = room.amenities?.slice(0, 4) || [];
                
                return (
                  <Link
                    key={room.id}
                    href={`/rooms/${slug}`}
                    className="group bg-white rounded-2xl overflow-hidden shadow-card hover:shadow-card-hover transition-all duration-300 hover:-translate-y-1"
                  >
                    <div className="aspect-[4/3] relative bg-nude-200">
                      {room.images && room.images[0] ? (
                        <Image
                          src={room.images[0]}
                          alt={room.roomType}
                          fill
                          className="object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-terracotta-800">
                          <Home className="w-16 h-16" />
                        </div>
                      )}
                    </div>
                    <div className="p-6">
                      <h3 className="font-display text-2xl font-bold text-terracotta-900 mb-2">
                        {room.roomType}
                      </h3>
                      <p className="text-khaki-600 font-semibold mb-4">
                        From {room.currency} {Number(room.baseRate || 0).toLocaleString()}/night
                      </p>
                      <ul className="space-y-2 mb-4">
                        {displayAmenities.map((amenity) => (
                          <li key={amenity} className="flex items-center gap-2 text-sm text-terracotta-800">
                            <Check className="w-4 h-4 text-sage" />
                            {amenity}
                          </li>
                        ))}
                      </ul>
                      <div className="text-khaki-600 font-semibold group-hover:text-khaki-700 flex items-center gap-2">
                        View Details
                        <span className="group-hover:translate-x-1 transition-transform">→</span>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        </section>

        {/* Dining Section */}
        {restaurant && (
          <section id="dining" className="py-20 bg-nude-50">
            <div className="container mx-auto px-4">
              <div className="grid md:grid-cols-2 gap-12 items-center">
                <div>
                  <h2 className="font-display text-4xl md:text-5xl font-bold text-terracotta-900 mb-6">
                    {restaurant.name}
                  </h2>
                  <p className="text-lg text-terracotta-800 mb-6 leading-relaxed">
                    {restaurant.description || "Our on-site restaurant serves authentic Namibian cuisine alongside international favorites. Start your day with our breakfast service, enjoy traditional dishes for lunch, and savor expertly prepared dinners featuring signature dishes like slow-cooked oshifima with spinach, fresh Zambezi bream, and hearty potjie."}
                  </p>
                  
                  {menuPreview.length > 0 && (
                    <div className="mb-6">
                      <h3 className="font-semibold text-terracotta-900 mb-3">Featured Items:</h3>
                      <div className="space-y-2">
                        {menuPreview.map((item, idx) => (
                          <div key={idx} className="flex justify-between items-center text-sm">
                            <span className="text-terracotta-800">{item.name}</span>
                            <span className="text-khaki-600 font-semibold">{item.price}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  <ul className="space-y-3 mb-8">
                    {[
                      'Traditional Namibian specialties',
                      'Fresh, locally-sourced ingredients',
                      'Vegetarian and dietary options',
                    ].map((feature) => (
                      <li key={feature} className="flex items-center gap-3 text-terracotta-800">
                        <div className="w-2 h-2 rounded-full bg-sage" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                  <Button asChild size="lg">
                    <Link href="/dining">
                      <Utensils className="w-5 h-5" />
                      View Full Menu
                    </Link>
                  </Button>
                </div>
                <div className="relative h-[400px] rounded-2xl overflow-hidden shadow-card">
                  {restaurant.images && restaurant.images[0] ? (
                    <Image
                      src={restaurant.images[0]}
                      alt={restaurant.name}
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <Image
                      src="/images/hospitality/restaurant_dining.jpeg"
                      alt={restaurant.name}
                      fill
                      className="object-cover"
                    />
                  )}
                </div>
              </div>
            </div>
          </section>
        )}

        {/* Tours Section */}
        <section id="tours" className="py-20 bg-white">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="font-display text-4xl md:text-5xl font-bold text-terracotta-900 mb-4">
                Explore Ongwediva & Beyond
              </h2>
              <p className="text-lg text-terracotta-800 max-w-2xl mx-auto">
                Discover the cultural richness and natural beauty of Northern Namibia with our curated tours
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {[
                {
                  name: 'Cultural Heritage Tour',
                  description: 'Visit traditional villages, meet local artisans, and learn about Oshiwambo culture.',
                  icon: Compass,
                  duration: 'Half Day',
                },
                {
                  name: 'Nature & Wildlife',
                  description: 'Explore nearby nature reserves, spot local wildlife, and enjoy scenic landscapes.',
                  icon: Sparkles,
                  duration: 'Full Day',
                },
                {
                  name: 'City & Market Tour',
                  description: 'Experience Ongwediva\'s vibrant markets, Trade Fair grounds, and city highlights.',
                  icon: MapPin,
                  duration: '3-4 Hours',
                },
              ].map((tour) => (
                <div
                  key={tour.name}
                  className="bg-nude-50 rounded-2xl p-8 hover:shadow-card transition-shadow"
                >
                  <div className="w-12 h-12 bg-sage/20 rounded-full flex items-center justify-center mb-4">
                    <tour.icon className="w-6 h-6 text-sage" />
                  </div>
                  <h3 className="font-display text-2xl font-bold text-terracotta-900 mb-3">
                    {tour.name}
                  </h3>
                  <p className="text-terracotta-800 mb-4">{tour.description}</p>
                  <div className="text-sm text-khaki-600 font-semibold">{tour.duration}</div>
                </div>
              ))}
            </div>
            
            <div className="text-center mt-12">
              <Button asChild size="lg">
                <Link href="/tours">
                  See All Tours & Activities
                </Link>
              </Button>
            </div>
          </div>
        </section>

        {/* Guest Reviews Section */}
        <section className="py-20 bg-nude-50">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              {avgRating > 0 && (
                <div className="inline-flex items-center gap-2 bg-sage/20 text-sage px-4 py-2 rounded-full mb-4">
                  <Star className="w-5 h-5 fill-sage" />
                  <span className="font-bold text-lg">{avgRating.toFixed(1)}/5</span>
                  <span className="text-sm">{reviews.length} Reviews</span>
                </div>
              )}
              <h2 className="font-display text-4xl md:text-5xl font-bold text-terracotta-900 mb-4">
                Guest Love
              </h2>
              <p className="text-lg text-terracotta-800">
                What our guests say about their experience
              </p>
            </div>
            
            {reviews.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {reviews.map((review) => (
                  <div key={review.id} className="bg-white rounded-2xl p-6 shadow-card">
                    <div className="flex gap-1 mb-4">
                      {Array.from({ length: review.rating || 5 }).map((_, i) => (
                        <Star key={i} className="w-5 h-5 fill-khaki-600 text-khaki-600" />
                      ))}
                    </div>
                    <p className="text-terracotta-800 mb-4 italic">"{review.reviewText}"</p>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-khaki-600 rounded-full flex items-center justify-center text-white font-bold">
                        {(review.guestFirstName || 'G')[0].toUpperCase()}
                      </div>
                      <div>
                        <div className="font-semibold text-terracotta-900">
                          {review.guestFirstName || 'Guest'}
                        </div>
                        {(review.guestCity || review.guestCountry) && (
                          <div className="text-sm text-terracotta-800">
                            {[review.guestCity, review.guestCountry].filter(Boolean).join(', ')}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <p className="text-terracotta-800 text-lg">
                  No reviews yet. Be the first to share your experience!
                </p>
              </div>
            )}
          </div>
        </section>

        {/* Booking Widget Section */}
        <section id="booking" className="py-20 bg-white">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto bg-gradient-to-br from-khaki-600 to-terracotta-800 rounded-3xl p-8 md:p-12 text-white">
              <h2 className="font-display text-4xl md:text-5xl font-bold mb-6 text-center">
                Book Your Stay
              </h2>
              <p className="text-center text-white/90 mb-8 text-lg">
                Experience authentic Namibian hospitality at Hotel Etuna
              </p>
              
              <div className="bg-white rounded-2xl p-6 md:p-8">
                <form className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-semibold text-terracotta-900 mb-2">
                      Check-in Date
                    </label>
                    <input
                      type="date"
                      className="w-full px-4 py-3 rounded-lg border border-nude-300 text-terracotta-900 focus:ring-2 focus:ring-khaki-600 focus:border-transparent"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-semibold text-terracotta-900 mb-2">
                      Check-out Date
                    </label>
                    <input
                      type="date"
                      className="w-full px-4 py-3 rounded-lg border border-nude-300 text-terracotta-900 focus:ring-2 focus:ring-khaki-600 focus:border-transparent"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-semibold text-terracotta-900 mb-2">
                      Guests
                    </label>
                    <select className="w-full px-4 py-3 rounded-lg border border-nude-300 text-terracotta-900 focus:ring-2 focus:ring-khaki-600 focus:border-transparent">
                      <option>1 Guest</option>
                      <option>2 Guests</option>
                      <option>3 Guests</option>
                      <option>4+ Guests</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-semibold text-terracotta-900 mb-2">
                      Room Type
                    </label>
                    <select className="w-full px-4 py-3 rounded-lg border border-nude-300 text-terracotta-900 focus:ring-2 focus:ring-khaki-600 focus:border-transparent">
                      {uniqueRoomTypes.map((room) => (
                        <option key={room.id} value={room.id}>
                          {room.roomType}
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  <div className="md:col-span-2">
                    <Button size="xl" className="w-full bg-khaki-600 hover:bg-khaki-700">
                      <Calendar className="w-5 h-5" />
                      Check Availability
                    </Button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </section>

        {/* Referral Partners Section */}
        {validPartners.length > 0 && (
          <section id="partners" className="py-20 bg-nude-50">
            <div className="container mx-auto px-4">
              <div className="text-center mb-12">
                <h2 className="font-display text-4xl md:text-5xl font-bold text-terracotta-900 mb-4">
                  More Lodging in Windhoek Area
                </h2>
                <p className="text-lg text-terracotta-800 max-w-2xl mx-auto">
                  Explore our trusted partner properties for alternative accommodation options
                </p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
                {validPartners.map((partner: any) => (
                  <Link
                    key={partner.id}
                    href={`/partners/${partner.slug}`}
                    className="group bg-white rounded-2xl overflow-hidden shadow-card hover:shadow-card-hover transition-all duration-300"
                  >
                    <div className="aspect-[16/9] relative bg-nude-200">
                      {partner.images && partner.images[0] ? (
                        <Image
                          src={partner.images[0]}
                          alt={partner.name}
                          fill
                          className="object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-terracotta-800">
                          <Home className="w-16 h-16" />
                        </div>
                      )}
                    </div>
                    <div className="p-6">
                      <h3 className="font-display text-2xl font-bold text-terracotta-900 mb-2">
                        {partner.name}
                      </h3>
                      <p className="text-terracotta-800 mb-3">
                        {partner.description || "Quality accommodation in Windhoek"}
                      </p>
                      <div className="flex items-center gap-2 text-sm text-khaki-600 font-semibold">
                        <MapPin className="w-4 h-4" />
                        {partner.city || 'Windhoek'}
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* Footer */}
        <footer className="bg-terracotta-900 text-white py-12">
          <div className="container mx-auto px-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
              {/* Brand */}
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-10 h-10 bg-khaki-600 rounded-full flex items-center justify-center font-display font-bold">
                    HE
                  </div>
                  <span className="font-display text-xl font-bold">Hotel Etuna</span>
                </div>
                <p className="text-white/80 text-sm mb-4">
                  He takes care of us – authentic Namibian hospitality in Ongwediva
                </p>
                <div className="flex gap-3">
                  <a href="#" className="w-8 h-8 bg-white/10 rounded-full flex items-center justify-center hover:bg-khaki-600 transition-colors">
                    f
                  </a>
                  <a href="#" className="w-8 h-8 bg-white/10 rounded-full flex items-center justify-center hover:bg-khaki-600 transition-colors">
                    in
                  </a>
                  <a href="#" className="w-8 h-8 bg-white/10 rounded-full flex items-center justify-center hover:bg-khaki-600 transition-colors">
                    ig
                  </a>
                </div>
              </div>
              
              {/* Quick Links */}
              <div>
                <h4 className="font-semibold mb-4">Quick Links</h4>
                <ul className="space-y-2 text-sm">
                  <li><Link href="/rooms" className="text-white/80 hover:text-khaki-600 transition-colors">Rooms</Link></li>
                  <li><Link href="/dining" className="text-white/80 hover:text-khaki-600 transition-colors">Dining</Link></li>
                  <li><Link href="/tours" className="text-white/80 hover:text-khaki-600 transition-colors">Tours</Link></li>
                  <li><Link href="/about" className="text-white/80 hover:text-khaki-600 transition-colors">About Us</Link></li>
                  <li><Link href="/contact" className="text-white/80 hover:text-khaki-600 transition-colors">Contact</Link></li>
                  <li><Link href="/partners" className="text-white/80 hover:text-khaki-600 transition-colors">Referral Partners – Windhoek Lodging</Link></li>
                </ul>
              </div>
              
              {/* Contact */}
              <div>
                <h4 className="font-semibold mb-4">Contact Us</h4>
                <ul className="space-y-3 text-sm">
                  {property && (
                    <>
                      <li className="flex items-start gap-2">
                        <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0" />
                        <span className="text-white/80">{property.address || "5544 Valley of the Leopard Street, Ongwediva, Namibia"}</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <Phone className="w-4 h-4 flex-shrink-0" />
                        <div className="text-white/80">
                          <div>+264 65 231 177</div>
                          <div>+264 81 802 4833</div>
                        </div>
                      </li>
                      <li className="flex items-center gap-2">
                        <Mail className="w-4 h-4 flex-shrink-0" />
                        <a href="mailto:info@hoteletuna.com" className="text-white/80 hover:text-khaki-600 transition-colors">
                          info@hoteletuna.com
                        </a>
                      </li>
                    </>
                  )}
                </ul>
              </div>
              
              {/* Hours */}
              <div>
                <h4 className="font-semibold mb-4">Hours</h4>
                <ul className="space-y-2 text-sm text-white/80">
                  <li>Check-in: {property?.checkInTime || "14:00"}</li>
                  <li>Check-out: {property?.checkOutTime || "11:00"}</li>
                  <li>Reception: 24/7</li>
                  <li>Restaurant: 06:30 - 22:00</li>
                </ul>
              </div>
            </div>
            
            <div className="border-t border-white/10 pt-8 flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-white/60">
              <p>© 2026 Hotel Etuna. All rights reserved.</p>
              <div className="flex gap-6">
                <Link href="/legal/privacy" className="hover:text-white transition-colors">Privacy Policy</Link>
                <Link href="/legal/terms" className="hover:text-white transition-colors">Terms of Service</Link>
              </div>
            </div>
          </div>
        </footer>
      </main>
    </div>
  );
}
