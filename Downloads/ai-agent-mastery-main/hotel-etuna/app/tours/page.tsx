/**
 * Tours & Experiences Page
 * 
 * Purpose: Showcase curated tours and activities in Ongwediva and Northern Namibia
 * Location: app/tours/page.tsx
 */

import { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/Button';
import { Compass, Users, Clock, MapPin, Car, Camera } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Tours & Experiences',
  description: 'Explore Ongwediva and Northern Namibia with our curated tours. Cultural heritage, nature, wildlife, and local experiences.',
};

const tours = [
  {
    name: 'Cultural Heritage Tour',
    duration: 'Half Day (4 hours)',
    groupSize: '2-8 people',
    price: 650,
    image: '/images/hospitality/hero_hotel_lobby.jpeg',
    description: 'Immerse yourself in authentic Oshiwambo culture with visits to traditional villages, local artisans, and cultural centers.',
    highlights: [
      'Visit traditional homestead',
      'Meet local craftspeople',
      'Learn about Oshiwambo customs',
      'Enjoy traditional snacks',
      'Visit cultural museum',
    ],
  },
  {
    name: 'Nature & Wildlife Experience',
    duration: 'Full Day (8 hours)',
    groupSize: '2-6 people',
    price: 1200,
    image: '/images/hospitality/restaurant_dining.jpeg',
    description: 'Explore Northern Namibia\'s natural beauty with visits to nature reserves, bird watching spots, and scenic landscapes.',
    highlights: [
      'Visit local nature reserve',
      'Bird watching opportunities',
      'Scenic photography stops',
      'Picnic lunch included',
      'Wildlife spotting',
    ],
  },
  {
    name: 'Ongwediva City & Markets Tour',
    duration: '3-4 hours',
    groupSize: '2-10 people',
    price: 450,
    image: '/images/hospitality/room_luxury.jpeg',
    description: 'Discover the vibrant city life of Ongwediva, including the famous Trade Fair grounds, local markets, and key landmarks.',
    highlights: [
      'Ongwediva Trade Fair grounds',
      'Local craft markets',
      'City landmarks',
      'Shopping opportunities',
      'Local food tasting',
    ],
  },
  {
    name: 'Windhoek Day Trip',
    duration: 'Full Day (10 hours)',
    groupSize: '2-6 people',
    price: 1500,
    image: '/images/hospitality/room_family.jpeg',
    description: 'Visit Namibia\'s capital city, exploring its colonial architecture, craft markets, and dining scene.',
    highlights: [
      'Christuskirche & landmarks',
      'Craft beer brewery tour',
      'Craft market shopping',
      'Lunch at local restaurant',
      'Independence Avenue',
    ],
  },
  {
    name: 'Traditional Cuisine Experience',
    duration: '3 hours',
    groupSize: '4-12 people',
    price: 550,
    image: '/images/hospitality/room_executive.jpeg',
    description: 'Learn to prepare traditional Namibian dishes with a local chef, followed by a communal dining experience.',
    highlights: [
      'Cooking demonstration',
      'Hands-on preparation',
      'Traditional recipes',
      'Communal dining',
      'Recipe booklet',
    ],
  },
  {
    name: 'Sunset Safari Drive',
    duration: '3-4 hours',
    groupSize: '2-8 people',
    price: 800,
    image: '/images/hospitality/room_premier.jpeg',
    description: 'Evening game drive through local reserves with sundowner drinks and wildlife viewing opportunities.',
    highlights: [
      'Game drive in open vehicle',
      'Sundowner drinks',
      'Wildlife photography',
      'Professional guide',
      'Stargazing opportunity',
    ],
  },
];

export default function ToursPage() {
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
        <section className="py-16 bg-gradient-to-br from-sage to-khaki-600 text-white">
          <div className="container mx-auto px-4 text-center">
            <Compass className="w-16 h-16 mx-auto mb-6" />
            <h1 className="font-display text-5xl md:text-6xl font-bold mb-6">
              Tours & Experiences
            </h1>
            <p className="text-xl md:text-2xl max-w-3xl mx-auto opacity-95">
              Discover the heart of Northern Namibia with our curated experiences
            </p>
          </div>
        </section>

        {/* Tours Grid */}
        <section className="py-16">
          <div className="container mx-auto px-4">
            <div className="max-w-7xl mx-auto grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {tours.map((tour) => (
                <div
                  key={tour.name}
                  className="bg-white rounded-2xl overflow-hidden shadow-card hover:shadow-card-hover transition-all duration-300"
                >
                  <div className="aspect-[4/3] relative bg-nude-200">
                    <Image
                      src={tour.image}
                      alt={tour.name}
                      fill
                      className="object-cover"
                    />
                  </div>
                  
                  <div className="p-6">
                    <h3 className="font-display text-2xl font-bold text-terracotta-900 mb-3">
                      {tour.name}
                    </h3>
                    
                    <div className="flex items-center gap-4 text-sm text-terracotta-800 mb-4">
                      <div className="flex items-center gap-1.5">
                        <Clock className="w-4 h-4 text-khaki-600" />
                        {tour.duration}
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Users className="w-4 h-4 text-khaki-600" />
                        {tour.groupSize}
                      </div>
                    </div>

                    <p className="text-terracotta-800 mb-4 text-sm leading-relaxed">
                      {tour.description}
                    </p>

                    <div className="mb-4">
                      <h4 className="font-semibold text-terracotta-900 text-sm mb-2">Highlights:</h4>
                      <ul className="space-y-1">
                        {tour.highlights.slice(0, 3).map((highlight) => (
                          <li key={highlight} className="text-sm text-terracotta-800 flex items-start gap-2">
                            <span className="text-sage mt-0.5">•</span>
                            {highlight}
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="border-t border-nude-200 pt-4 flex items-center justify-between">
                      <div>
                        <div className="text-2xl font-display font-bold text-khaki-600">
                          NAD {tour.price.toLocaleString()}
                        </div>
                        <div className="text-xs text-terracotta-800">per person</div>
                      </div>
                      <Button size="sm">Inquire</Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* What's Included */}
        <section className="py-16 bg-nude-50">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto">
              <h2 className="font-display text-4xl font-bold text-terracotta-900 mb-12 text-center">
                What's Included
              </h2>
              
              <div className="grid md:grid-cols-2 gap-6">
                {[
                  { icon: Car, label: 'Hotel Pick-up & Drop-off', desc: 'Convenient transportation from Hotel Etuna' },
                  { icon: Users, label: 'Professional Guide', desc: 'Knowledgeable local guides fluent in English' },
                  { icon: Camera, label: 'Photography Stops', desc: 'Plenty of opportunities for memorable photos' },
                  { icon: MapPin, label: 'Entry Fees', desc: 'All entrance fees and permits included' },
                ].map((item) => (
                  <div key={item.label} className="flex gap-4 bg-white rounded-xl p-6">
                    <div className="w-12 h-12 bg-sage/20 rounded-full flex items-center justify-center flex-shrink-0">
                      <item.icon className="w-6 h-6 text-sage" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-terracotta-900 mb-1">{item.label}</h3>
                      <p className="text-sm text-terracotta-800">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-16 bg-gradient-to-br from-terracotta-800 to-terracotta-900 text-white">
          <div className="container mx-auto px-4 text-center">
            <h2 className="font-display text-4xl font-bold mb-4">
              Ready to Explore?
            </h2>
            <p className="text-xl text-white/90 mb-8 max-w-2xl mx-auto">
              Contact our concierge to book your tour or create a custom experience
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button asChild size="xl" className="bg-white text-terracotta-900 hover:bg-nude-100">
                <Link href="/contact">Contact Concierge</Link>
              </Button>
              <Button asChild size="xl" variant="outline" className="border-white text-white hover:bg-white/20">
                <Link href="/">Book Your Stay</Link>
              </Button>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
