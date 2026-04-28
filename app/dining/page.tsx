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
import { Utensils, Coffee, Clock, Leaf } from 'lucide-react';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { getCompleteMenu } from '@/lib/data/dining';
import PublicHero from '@/components/shared/PublicHero';
import Footer from '@/components/shared/Footer';
import NavigationHeader from '@/components/sections/landing/NavigationHeader';

export const metadata: Metadata = {
  title: 'Dining & Restaurant',
  description: 'Experience authentic Namibian cuisine at Hotel Etuna. Buffet breakfast, traditional specialties, and international favorites.',
};

export default async function DiningPage() {
  const session = await getServerSession(authOptions);
  const isAuthenticated = Boolean(session?.user);
  
  // Use data access layer
  const { restaurant, categories: categoryRows, itemsByCategory } = await getCompleteMenu();

  return (
    <div className="min-h-screen bg-surface-background">
      <NavigationHeader />

      <main>
        <PublicHero
          title="A Taste of Namibia"
          subtitle="Authentic flavors and warm hospitality in every dish."
          backgroundImage="/images/hospitality/restaurant_dining.jpeg"
          breadcrumbLabel="Dining"
        />

        {/* Restaurant Overview */}
        <section className="py-16 bg-white">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto text-center">
              <h2 className="font-display text-4xl font-bold text-terracotta-900 mb-6">
                {restaurant?.name ?? 'Our Restaurant'}
              </h2>
              <p className="text-lg text-terracotta-800 leading-relaxed mb-8">
                {restaurant?.description ??
                  "At Hotel Etuna, dining is more than just a meal-it's an experience that celebrates Namibian culture and hospitality."}
              </p>
              <div className="grid md:grid-cols-3 gap-6 mt-12">
                <div className="bg-nude-50 rounded-xl p-6">
                  <div className="w-12 h-12 bg-sage/20 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Leaf className="w-6 h-6 text-sage" />
                  </div>
                  <h3 className="font-semibold text-terracotta-900 mb-2">Fresh & Local</h3>
                  <p className="text-sm text-terracotta-800">
                    Ingredients sourced from local suppliers
                  </p>
                </div>
                <div className="bg-nude-50 rounded-xl p-6">
                  <div className="w-12 h-12 bg-sage/20 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Utensils className="w-6 h-6 text-sage" />
                  </div>
                  <h3 className="font-semibold text-terracotta-900 mb-2">Expert Chefs</h3>
                  <p className="text-sm text-terracotta-800">
                    Experienced culinary team with passion
                  </p>
                </div>
                <div className="bg-nude-50 rounded-xl p-6">
                  <div className="w-12 h-12 bg-sage/20 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Clock className="w-6 h-6 text-sage" />
                  </div>
                  <h3 className="font-semibold text-terracotta-900 mb-2">All Day Dining</h3>
                  <p className="text-sm text-terracotta-800">
                    Breakfast, lunch, and dinner service
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Menu Categories */}
        <section className="py-16 bg-nude-50">
          <div className="container mx-auto px-4">
            <div className="max-w-6xl mx-auto">
              <h2 className="font-display text-4xl font-bold text-terracotta-900 mb-12 text-center">
                Our Menu
              </h2>
              
              <div className="grid md:grid-cols-3 gap-8">
                {categoryRows.map((category) => (
                  <div key={category.id} className="bg-white rounded-2xl p-8 shadow-card">
                    <div className="w-16 h-16 bg-khaki-600 rounded-full flex items-center justify-center mb-4">
                      {category.name.toLowerCase().includes('breakfast') ? (
                        <Coffee className="w-8 h-8 text-white" />
                      ) : (
                        <Utensils className="w-8 h-8 text-white" />
                      )}
                    </div>
                    
                    <h3 className="font-display text-2xl font-bold text-terracotta-900 mb-2">
                      {category.name}
                    </h3>
                    
                    <div className="flex items-center gap-2 text-sm text-khaki-600 font-semibold mb-6">
                      <Clock className="w-4 h-4" />
                      {category.name.toLowerCase().includes('breakfast') ? 'Breakfast service' : 'All day'}
                    </div>

                    <ul className="space-y-3">
                      {(itemsByCategory.get(category.id) ?? []).slice(0, 6).map((item: { id: string; name: string; currency?: string | null; price: unknown }) => (
                        <li key={item.id} className="flex items-start gap-2 text-terracotta-800">
                          <span className="text-sage mt-1">•</span>
                          {isAuthenticated
                            ? `${item.name} (${item.currency ?? 'NAD'} ${Number(item.price).toLocaleString()})`
                            : item.name}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Dining Experience */}
        <section className="py-16 bg-white">
          <div className="container mx-auto px-4">
            <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-12 items-center">
              <div>
                <h2 className="font-display text-4xl font-bold text-terracotta-900 mb-6">
                  Dining Experience
                </h2>
                <div className="space-y-6">
                  <div>
                    <h3 className="font-semibold text-lg text-terracotta-900 mb-2">Indoor Dining</h3>
                    <p className="text-terracotta-800">
                      Our air-conditioned restaurant seats up to 60 guests in a comfortable, elegant setting 
                      with authentic Namibian decor.
                    </p>
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg text-terracotta-900 mb-2">Outdoor Terrace</h3>
                    <p className="text-terracotta-800">
                      Enjoy your meal under the African sky on our covered terrace, perfect for breakfast or 
                      evening dining with views of our gardens.
                    </p>
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg text-terracotta-900 mb-2">Room Service</h3>
                    <p className="text-terracotta-800">
                      Prefer to dine in your room? Our room service menu is available from 7:00 AM to 10:00 PM 
                      with a selection of our most popular dishes.
                    </p>
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg text-terracotta-900 mb-2">Dietary Requirements</h3>
                    <p className="text-terracotta-800">
                      We accommodate vegetarian, vegan, halal, and other dietary requirements. Please inform 
                      our staff of any allergies or preferences.
                    </p>
                  </div>
                </div>
              </div>
              <div className="aspect-4/3 relative rounded-2xl overflow-hidden shadow-card">
                <Image
                  src="/images/hospitality/restaurant_dining.jpeg"
                  alt="Dining Experience at Hotel Etuna"
                  fill
                  className="object-cover"
                />
              </div>
            </div>
          </div>
        </section>

        {/* Hours & Reservations */}
        <section className="py-16 bg-linear-to-br from-khaki-600 to-terracotta-800 text-white">
          <div className="container mx-auto px-4 text-center">
            <h2 className="font-display text-4xl font-bold mb-6">
              Operating Hours
            </h2>
            <div className="max-w-2xl mx-auto grid md:grid-cols-3 gap-8 mb-8">
              <div>
                <h3 className="font-semibold text-xl mb-2">Breakfast</h3>
                <p className="text-white/90">6:00 AM - 10:00 AM</p>
              </div>
              <div>
                <h3 className="font-semibold text-xl mb-2">Lunch</h3>
                <p className="text-white/90">12:00 PM - 3:00 PM</p>
              </div>
              <div>
                <h3 className="font-semibold text-xl mb-2">Dinner</h3>
                <p className="text-white/90">6:00 PM - 10:00 PM</p>
              </div>
            </div>
            <p className="text-white/90 mb-8">
              Reservations recommended for dinner, especially on weekends
            </p>
            <Button asChild size="xl" className="bg-white text-terracotta-900 hover:bg-rustic hover:text-white">
              <Link href={isAuthenticated ? '/contact' : '/login?redirect=/dining'}>
                {isAuthenticated ? 'Make a Reservation' : 'Sign in to order online'}
              </Link>
            </Button>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
