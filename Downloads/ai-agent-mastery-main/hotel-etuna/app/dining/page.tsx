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

export const metadata: Metadata = {
  title: 'Dining & Restaurant',
  description: 'Experience authentic Namibian cuisine at Hotel Etuna. Buffet breakfast, traditional specialties, and international favorites.',
};

export default function DiningPage() {
  const menuCategories = [
    {
      name: 'Breakfast Buffet',
      time: '6:00 AM - 10:00 AM',
      icon: Coffee,
      items: [
        'Fresh Tropical Fruits',
        'Pastries & Breads',
        'Hot Namibian Dishes',
        'Eggs to Order',
        'Cereals & Yogurt',
        'Fresh Juices & Coffee',
      ],
    },
    {
      name: 'Traditional Namibian',
      time: 'All Day',
      icon: Utensils,
      items: [
        'Potjiekos (Slow-cooked Stew)',
        'Boerewors (Traditional Sausage)',
        'Biltong Platter',
        'Kapana (Grilled Meat)',
        'Oshiwambo Cuisine',
        'Grilled Game Meats',
      ],
    },
    {
      name: 'International Favorites',
      time: '11:00 AM - 9:00 PM',
      icon: Utensils,
      items: [
        'Grilled Steaks',
        'Fresh Seafood',
        'Pasta Dishes',
        'Gourmet Burgers',
        'Chef Salads',
        'Vegetarian Options',
      ],
    },
  ];

  return (
    <div className="min-h-screen bg-surface-background">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-sm border-b border-nude-200">
        <nav className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-10 h-10 bg-khaki-600 rounded-full flex items-center justify-center text-white font-display font-bold">
              HE
            </div>
            <div className="flex flex-col">
              <span className="font-display text-lg font-bold text-terracotta-900">Hotel Etuna</span>
            </div>
          </Link>
          
          <Button asChild size="sm">
            <Link href="/">Back to Home</Link>
          </Button>
        </nav>
      </header>

      <main>
        {/* Hero */}
        <section className="relative h-[500px] flex items-center overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-terracotta-900/60 to-terracotta-900/40 z-10" />
          <div 
            className="absolute inset-0 bg-cover bg-center"
            style={{ backgroundImage: "url('/images/hospitality/restaurant_dining.jpeg')" }}
          />
          
          <div className="relative z-20 container mx-auto px-4 text-white">
            <h1 className="font-display text-5xl md:text-6xl font-bold mb-6">
              A Taste of Namibia
            </h1>
            <p className="text-xl md:text-2xl max-w-2xl opacity-95">
              Authentic flavors and warm hospitality in every dish
            </p>
          </div>
        </section>

        {/* Restaurant Overview */}
        <section className="py-16 bg-white">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto text-center">
              <h2 className="font-display text-4xl font-bold text-terracotta-900 mb-6">
                Our Restaurant
              </h2>
              <p className="text-lg text-terracotta-800 leading-relaxed mb-8">
                At Hotel Etuna, dining is more than just a meal—it's an experience that celebrates Namibian 
                culture and hospitality. Our on-site restaurant serves a carefully curated menu featuring 
                traditional Namibian specialties alongside international favorites, all prepared with fresh, 
                locally-sourced ingredients.
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
                {menuCategories.map((category) => (
                  <div key={category.name} className="bg-white rounded-2xl p-8 shadow-card">
                    <div className="w-16 h-16 bg-khaki-600 rounded-full flex items-center justify-center mb-4">
                      <category.icon className="w-8 h-8 text-white" />
                    </div>
                    
                    <h3 className="font-display text-2xl font-bold text-terracotta-900 mb-2">
                      {category.name}
                    </h3>
                    
                    <div className="flex items-center gap-2 text-sm text-khaki-600 font-semibold mb-6">
                      <Clock className="w-4 h-4" />
                      {category.time}
                    </div>

                    <ul className="space-y-3">
                      {category.items.map((item) => (
                        <li key={item} className="flex items-start gap-2 text-terracotta-800">
                          <span className="text-sage mt-1">•</span>
                          {item}
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
              <div className="aspect-[4/3] relative rounded-2xl overflow-hidden shadow-card">
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
        <section className="py-16 bg-gradient-to-br from-khaki-600 to-terracotta-800 text-white">
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
            <Button asChild size="xl" className="bg-white text-terracotta-900 hover:bg-nude-100">
              <Link href="/contact">Make a Reservation</Link>
            </Button>
          </div>
        </section>
      </main>
    </div>
  );
}
